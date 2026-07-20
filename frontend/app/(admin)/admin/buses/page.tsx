"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Bus as BusIcon, CheckCircle2, Wrench, PauseCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { fetchApi, BusData, BusResponse } from "@/utils/api";
import DataTable, { Column } from "@/component/ui/DataTable";
import PageHeader from "@/component/ui/PageHeader";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import LoadingSpinner from "@/component/ui/LoadingSpinner";
import StatsCard from "@/component/ui/StatsCard";
import StatusBadge from "@/component/ui/StatusBadge";

const busSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required"),
  modelName: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(["Active", "Maintenance", "Inactive"]),
});

type BusFormData = z.infer<typeof busSchema>;

const statusFilters = ["All", "Active", "Maintenance", "Inactive"] as const;

function statusTone(status: string) {
  if (status === "Active") return "success" as const;
  if (status === "Maintenance") return "warning" as const;
  return "neutral" as const;
}

function toCsv(rows: BusData[]) {
  const header = ["Bus Number", "Model", "Capacity", "Status"];
  const lines = rows.map((b) =>
    [b.busNumber, b.modelName ?? "", b.capacity ?? "", b.status]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(rows: BusData[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "buses.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function BusesPage() {
  const { token } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBus, setDeletingBus] = useState<BusData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: { status: "Active" },
  });

  const fetchBuses = () => {
    fetchApi<{ success: boolean; buses: BusData[] }>("/buses", {}, token ?? undefined)
      .then((res) => setBuses(res.buses))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    setEditingBus(null);
    reset({ busNumber: "", modelName: "", capacity: undefined, status: "Active" });
    setShowModal(true);
  };

  const openEdit = (bus: BusData) => {
    setEditingBus(bus);
    reset({
      busNumber: bus.busNumber,
      modelName: bus.modelName ?? "",
      capacity: bus.capacity,
      status: bus.status as "Active" | "Maintenance" | "Inactive",
    });
    setShowModal(true);
  };

  const onSubmit = async (data: BusFormData) => {
    setSubmitting(true);
    try {
      if (editingBus) {
        await fetchApi<BusResponse>(
          `/buses/${editingBus._id}`,
          { method: "PUT", body: JSON.stringify(data) },
          token ?? undefined
        );
      } else {
        await fetchApi<BusResponse>(
          "/buses",
          { method: "POST", body: JSON.stringify(data) },
          token ?? undefined
        );
      }
      setShowModal(false);
      reset();
      fetchBuses();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (bus: BusData) => {
    setDeletingBus(bus);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingBus) return;
    try {
      await fetchApi(`/buses/${deletingBus._id}`, { method: "DELETE" }, token ?? undefined);
      setShowDeleteConfirm(false);
      setDeletingBus(null);
      fetchBuses();
    } catch (err) {
      console.error(err);
    }
  };

  const summary = useMemo(() => {
    const active = buses.filter((b) => b.status === "Active").length;
    const maintenance = buses.filter((b) => b.status === "Maintenance").length;
    const inactive = buses.filter((b) => b.status === "Inactive").length;
    const avgCapacity =
      buses.length > 0
        ? Math.round(
            buses.reduce((sum, b) => sum + (b.capacity || 0), 0) / buses.length
          )
        : 0;
    return { active, maintenance, inactive, avgCapacity };
  }, [buses]);

  const filteredBuses = useMemo(
    () => (statusFilter === "All" ? buses : buses.filter((b) => b.status === statusFilter)),
    [buses, statusFilter]
  );

  const columns: Column<BusData & Record<string, unknown>>[] = [
    {
      key: "busNumber",
      label: "Bus Number",
      searchable: true,
      render: (item) => {
        const bus = item as unknown as BusData;
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BusIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">{bus.busNumber}</span>
          </div>
        );
      },
    },
    {
      key: "modelName",
      label: "Model",
      searchable: true,
      render: (item) => (item as unknown as BusData).modelName ?? "—",
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (item) => {
        const cap = (item as unknown as BusData).capacity;
        return cap ? `${cap} seats` : "—";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (item) => {
        const bus = item as unknown as BusData;
        return <StatusBadge label={bus.status} tone={statusTone(bus.status)} pulse={bus.status === "Active"} />;
      },
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fleet Management"
        title="Buses"
        description="Manage every vehicle in your fleet — status, capacity and assignment."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Bus
          </button>
        }
      />

      {/* Bento summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={BusIcon} label="Total Buses" value={buses.length} tone="primary" />
        <StatsCard icon={CheckCircle2} label="Active" value={summary.active} tone="accent" />
        <StatsCard icon={Wrench} label="In Maintenance" value={summary.maintenance} tone="warning" />
        <StatsCard
          icon={PauseCircle}
          label="Inactive"
          value={summary.inactive}
          tone="neutral"
          subtitle={`avg. ${summary.avgCapacity} seats/bus`}
        />
      </div>

      <DataTable
        data={filteredBuses as unknown as (BusData & Record<string, unknown>)[]}
        columns={columns}
        onEdit={(item) => openEdit(item as unknown as BusData)}
        onDelete={(item) => confirmDelete(item as unknown as BusData)}
        onExport={(rows) => downloadCsv(rows as unknown as BusData[])}
        searchPlaceholder="Search by bus number or model..."
        emptyMessage="No buses match this filter yet."
        filters={
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBus ? "Edit Bus" : "Add Bus"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Bus Number</label>
            <input
              {...register("busNumber")}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            {errors.busNumber && (
              <p className="mt-1 text-xs text-danger">{errors.busNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Model</label>
            <input
              {...register("modelName")}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Capacity</label>
            <input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-danger">{errors.capacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Status</label>
            <select
              {...register("status")}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingBus ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Bus"
        message={`Are you sure you want to delete bus "${deletingBus?.busNumber}"? This action cannot be undone.`}
      />
    </div>
  );
}
