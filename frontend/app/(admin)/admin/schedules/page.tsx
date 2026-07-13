"use client";

import { useEffect, useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DataTable, { Column } from "@/component/ui/DataTable";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import PageHeader from "@/component/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  fetchApi,
  SchedulesResponse,
  ScheduleData,
  BusesResponse,
  BusData,
  RoutesResponse,
  RouteData,
} from "@/utils/api";

const scheduleSchema = z.object({
  route: z.string().min(1, "Route is required"),
  bus: z.string().min(1, "Bus is required"),
  firstBus: z.string().min(1, "First bus time is required"),
  lastBus: z.string().min(1, "Last bus time is required"),
  frequency: z.string().min(1, "Frequency is required"),
  active: z.boolean(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export default function SchedulesPage() {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ScheduleData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState<ScheduleData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { active: false },
  });

  const fetchData = async () => {
    try {
      const [schedulesRes, busesRes, routesRes] = await Promise.all([
        fetchApi<SchedulesResponse>("/schedules", {}, token),
        fetchApi<BusesResponse>("/buses", {}, token),
        fetchApi<RoutesResponse>("/routes", {}, token),
      ]);
      if (schedulesRes.success) setSchedules(schedulesRes.schedules);
      if (busesRes.success) setBuses(busesRes.buses);
      if (routesRes.success) setRoutes(routesRes.routes);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    reset({ route: "", bus: "", firstBus: "", lastBus: "", frequency: "", active: false });
    setShowModal(true);
  };

  const openEdit = (schedule: ScheduleData) => {
    setEditing(schedule);
    reset({
      route: schedule.route?._id || "",
      bus: schedule.bus?._id || "",
      firstBus: schedule.firstBus,
      lastBus: schedule.lastBus,
      frequency: schedule.frequency,
      active: schedule.active,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ScheduleForm) => {
    setSubmitting(true);
    try {
      if (editing) {
        await fetchApi(`/schedules/${editing._id}`, { method: "PUT", body: JSON.stringify(data) }, token);
      } else {
        await fetchApi("/schedules", { method: "POST", body: JSON.stringify(data) }, token);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await fetchApi(`/schedules/${deleting._id}`, { method: "DELETE" }, token);
      setShowDeleteConfirm(false);
      setDeleting(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const columns: Column<ScheduleData>[] = [
    {
      key: "route",
      label: "Route",
      searchable: true,
      render: (item) => (
        <span className="font-medium">{item.route?.routeNo} {item.route?.from} → {item.route?.to}</span>
      ),
    },
    {
      key: "bus",
      label: "Bus",
      render: (item) => item.bus?.busNumber || "N/A",
    },
    { key: "firstBus", label: "First Bus" },
    { key: "lastBus", label: "Last Bus" },
    { key: "frequency", label: "Frequency" },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
          item.status === "On Time" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      key: "active",
      label: "Active",
      render: (item) =>
        item.active ? (
          <Check size={16} className="text-green-600" />
        ) : (
          <X size={16} className="text-red-400" />
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Schedule Management"
        description="Manage bus schedules and timetables"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            <Plus size={16} />
            Add Schedule
          </button>
        }
      />

      <DataTable
        data={schedules as any}
        columns={columns}
        onEdit={openEdit}
        onDelete={(item) => { setDeleting(item); setShowDeleteConfirm(true); }}
        loading={loading}
        emptyMessage="No schedules found"
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Schedule" : "Add Schedule"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Route</label>
            <select {...register("route")} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">Select route</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>{r.routeNo} - {r.from} → {r.to}</option>
              ))}
            </select>
            {errors.route && <p className="mt-1 text-xs text-red-500">{errors.route.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bus</label>
            <select {...register("bus")} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">Select bus</option>
              {buses.map((b) => (
                <option key={b._id} value={b._id}>{b.busNumber}</option>
              ))}
            </select>
            {errors.bus && <p className="mt-1 text-xs text-red-500">{errors.bus.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Bus</label>
              <input {...register("firstBus")} placeholder="e.g. 6:00 AM" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              {errors.firstBus && <p className="mt-1 text-xs text-red-500">{errors.firstBus.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Bus</label>
              <input {...register("lastBus")} placeholder="e.g. 10:00 PM" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              {errors.lastBus && <p className="mt-1 text-xs text-red-500">{errors.lastBus.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
            <input {...register("frequency")} placeholder="e.g. Every 15 min" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            {errors.frequency && <p className="mt-1 text-xs text-red-500">{errors.frequency.message}</p>}
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("active")} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">
              {submitting ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleting(null); }}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message={`Are you sure you want to delete this schedule? This action cannot be undone.`}
      />
    </div>
  );
}
