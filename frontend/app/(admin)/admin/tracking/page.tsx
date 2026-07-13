"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  fetchApi,
  TrackingData,
  TrackingResponse,
  BusData,
  RouteData,
  RoutesResponse,
} from "@/utils/api";
import DataTable, { Column } from "@/component/ui/DataTable";
import PageHeader from "@/component/ui/PageHeader";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import LoadingSpinner from "@/component/ui/LoadingSpinner";

const trackingSchema = z.object({
  bus: z.string().min(1, "Bus is required"),
  route: z.string().min(1, "Route is required"),
});

type TrackingFormData = z.infer<typeof trackingSchema>;

export default function TrackingPage() {
  const { token } = useAuth();
  const [tracking, setTracking] = useState<TrackingData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTracking, setDeletingTracking] = useState<TrackingData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
  });

  const fetchAll = async () => {
    try {
      const [trackRes, busRes, routeRes] = await Promise.all([
        fetchApi<TrackingResponse>("/tracking", {}, token ?? undefined),
        fetchApi<{ success: boolean; buses: BusData[] }>("/buses", {}, token ?? undefined),
        fetchApi<RoutesResponse>("/routes", {}, token ?? undefined),
      ]);
      setTracking(trackRes.tracking);
      setBuses(busRes.buses);
      setRoutes(routeRes.routes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  const openCreate = () => {
    reset({ bus: "", route: "" });
    setShowModal(true);
  };

  const onSubmit = async (data: TrackingFormData) => {
    setSubmitting(true);
    try {
      await fetchApi(
        "/tracking/initialize",
        { method: "POST", body: JSON.stringify(data) },
        token ?? undefined
      );
      setShowModal(false);
      reset();
      fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (item: TrackingData) => {
    setDeletingTracking(item);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingTracking) return;
    try {
      await fetchApi(
        `/tracking/${deletingTracking._id}`,
        { method: "DELETE" },
        token ?? undefined
      );
      setShowDeleteConfirm(false);
      setDeletingTracking(null);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<TrackingData & Record<string, unknown>>[] = [
    {
      key: "bus",
      label: "Bus",
      searchable: true,
      render: (item) => (item as unknown as TrackingData).bus?.busNumber || "N/A",
    },
    {
      key: "route",
      label: "Route",
      render: (item) => {
        const t = item as unknown as TrackingData;
        return `${t.route?.routeNo || ""} ${t.route?.from || ""} → ${t.route?.to || ""}`;
      },
    },
    {
      key: "speed",
      label: "Speed",
      render: (item) => `${(item as unknown as TrackingData).speed} km/h`,
    },
    { key: "nextStop", label: "Next Stop" },
    { key: "eta", label: "ETA" },
    {
      key: "status",
      label: "Status",
      render: () => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking"
        description="Manage live bus tracking"
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#22a34a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c8a3e]"
          >
            <Plus className="h-4 w-4" />
            Initialize Tracking
          </button>
        }
      />

      <DataTable
        data={tracking as unknown as (TrackingData & Record<string, unknown>)[]}
        columns={columns}
        onDelete={(item) => confirmDelete(item as unknown as TrackingData)}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Initialize Tracking"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bus
            </label>
            <select
              {...register("bus")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a bus</option>
              {buses.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.busNumber}
                </option>
              ))}
            </select>
            {errors.bus && (
              <p className="mt-1 text-xs text-red-500">{errors.bus.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Route
            </label>
            <select
              {...register("route")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a route</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeNo} - {r.from} → {r.to}
                </option>
              ))}
            </select>
            {errors.route && (
              <p className="mt-1 text-xs text-red-500">{errors.route.message}</p>
            )}
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
              {submitting ? "Initializing..." : "Initialize"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Tracking"
        message="Are you sure you want to delete this tracking entry? This action cannot be undone."
      />
    </div>
  );
}
