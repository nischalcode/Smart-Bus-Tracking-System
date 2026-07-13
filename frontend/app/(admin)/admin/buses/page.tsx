"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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

const busSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required"),
  modelName: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(["Active", "Maintenance", "Inactive"]),
});

type BusFormData = z.infer<typeof busSchema>;

export default function BusesPage() {
  const { token } = useAuth();
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState<BusData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBus, setDeletingBus] = useState<BusData | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await fetchApi(
        `/buses/${deletingBus._id}`,
        { method: "DELETE" },
        token ?? undefined
      );
      setShowDeleteConfirm(false);
      setDeletingBus(null);
      fetchBuses();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<BusData & Record<string, unknown>>[] = [
    { key: "busNumber", label: "Bus Number", searchable: true },
    { key: "modelName", label: "Model", render: (item) => (item as unknown as BusData).modelName ?? "-" },
    { key: "capacity", label: "Capacity", render: (item) => String((item as unknown as BusData).capacity ?? "-") },
    {
      key: "status",
      label: "Status",
      render: (item) => {
        const bus = item as unknown as BusData;
        const color =
          bus.status === "Active"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : bus.status === "Maintenance"
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        return (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
            {bus.status}
          </span>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buses"
        description="Manage your fleet of buses"
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#22a34a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c8a3e]"
          >
            <Plus className="h-4 w-4" />
            Add Bus
          </button>
        }
      />

      <DataTable
        data={buses as unknown as (BusData & Record<string, unknown>)[]}
        columns={columns}
        onEdit={(item) => openEdit(item as unknown as BusData)}
        onDelete={(item) => confirmDelete(item as unknown as BusData)}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBus ? "Edit Bus" : "Add Bus"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bus Number
            </label>
            <input
              {...register("busNumber")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {errors.busNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.busNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model
            </label>
            <input
              {...register("modelName")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Capacity
            </label>
            <input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              {...register("status")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#22a34a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c8a3e] disabled:opacity-50"
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
