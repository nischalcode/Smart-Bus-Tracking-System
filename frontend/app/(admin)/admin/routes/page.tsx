"use client";

import { useState, useEffect } from "react";
import { Plus, Check, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { fetchApi, RouteData, RouteResponse } from "@/utils/api";
import DataTable, { Column } from "@/component/ui/DataTable";
import PageHeader from "@/component/ui/PageHeader";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import LoadingSpinner from "@/component/ui/LoadingSpinner";
import RouteMapPicker from "@/component/admin/RouteMapPicker"

const routeSchema = z.object({
  routeNo: z.string().min(1, "Route number is required"),
  from: z.string().min(1, "From is required"),
  to: z.string().min(1, "To is required"),
  via: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  status: z.string(),
  active: z.boolean(),
  pathCoordinatesText: z.string().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

export default function RoutesPage() {
  const { token } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState<RouteData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: { status: "On Time", active: true, pathCoordinatesText: "" },
  });

  const fetchRoutes = () => {
    fetchApi<{ success: boolean; routes: RouteData[] }>(
      "/routes",
      {},
      token ?? undefined
    )
      .then((res) => setRoutes(res.routes))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoutes();
  }, [token]);

  const openCreate = () => {
    setEditingRoute(null);
    reset({ routeNo: "", from: "", to: "", via: "", frequency: "", status: "On Time", active: true, pathCoordinatesText: "" });
    setShowModal(true);
  };

  const openEdit = (route: RouteData) => {
    setEditingRoute(route);
    reset({
      routeNo: route.routeNo,
      from: route.from,
      to: route.to,
      via: route.via ?? "",
      frequency: route.frequency,
      status: route.status ?? "On Time",
      active: route.active,
      pathCoordinatesText: route.pathCoordinates?.length
        ? JSON.stringify(route.pathCoordinates)
        : "",
    });
    setShowModal(true);
  };

  const onSubmit = async (data: RouteFormData) => {
    if (coordinates.length < 2) {
      alert("Please select at least 2 points on the map.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        routeNo: data.routeNo,
        from: data.from,
        to: data.to,
        via: data.via,
        frequency: data.frequency,
        status: data.status,
        active: data.active,

        // send coordinates directly from RouteMapPicker state
        pathCoordinates: coordinates,
      };

      console.log(payload);

      if (editingRoute) {
        await fetchApi<RouteResponse>(
          `/routes/${editingRoute._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
          token ?? undefined
        );
      } else {
        await fetchApi<RouteResponse>(
          "/routes",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          token ?? undefined
        );
      }

      setShowModal(false);

      reset();

      setCoordinates([]);

      fetchRoutes();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (route: RouteData) => {
    setDeletingRoute(route);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingRoute) return;
    try {
      await fetchApi(
        `/routes/${deletingRoute._id}`,
        { method: "DELETE" },
        token ?? undefined
      );
      setShowDeleteConfirm(false);
      setDeletingRoute(null);
      fetchRoutes();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<RouteData & Record<string, unknown>>[] = [
    { key: "routeNo", label: "Route No", searchable: true },
    {
      key: "from",
      label: "From → To",
      render: (item) => {
        const r = item as unknown as RouteData;
        return (
          <span>
            {r.from} → {r.to}
          </span>
        );
      },
    },
    { key: "frequency", label: "Frequency" },
    {
      key: "stops",
      label: "Stops",
      render: (item) => {
        const r = item as unknown as RouteData;
        return String(r.stops?.length ?? 0);
      },
    },
    {
      key: "active",
      label: "Active",
      render: (item) => {
        const r = item as unknown as RouteData;
        return r.active ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-red-500" />
        );
      },
    },
  ];

  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  
  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes"
        description="Manage bus routes"
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#22a34a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c8a3e]"
          >
            <Plus className="h-4 w-4" />
            Add Route
          </button>
        }
      />

      <DataTable
        data={routes as unknown as (RouteData & Record<string, unknown>)[]}
        columns={columns}
        onEdit={(item) => openEdit(item as unknown as RouteData)}
        onDelete={(item) => confirmDelete(item as unknown as RouteData)}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoute ? "Edit Route" : "Add Route"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Route No
              </label>
              <input
                {...register("routeNo")}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.routeNo && (
                <p className="mt-1 text-xs text-red-500">{errors.routeNo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frequency
              </label>
              <input
                {...register("frequency")}
                placeholder="e.g. every 15 min"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.frequency && (
                <p className="mt-1 text-xs text-red-500">{errors.frequency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                From
              </label>
              <input
                {...register("from")}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.from && (
                <p className="mt-1 text-xs text-red-500">{errors.from.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                To
              </label>
              <input
                {...register("to")}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.to && (
                <p className="mt-1 text-xs text-red-500">{errors.to.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Via
              </label>
              <input
                {...register("via")}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <input
                {...register("status")}
                placeholder="On Time"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-[#22a34a] focus:ring-[#22a34a]"
                  />
                )}
              />
              Active
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Path Coordinates
            </label>
            {/* <textarea
              {...register("pathCoordinatesText")}
              rows={3}
              placeholder='JSON array, e.g. [[12.97,77.59],[12.98,77.60]]'
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            /> */}
            <RouteMapPicker
                value={coordinates}
                onChange={setCoordinates}
            />
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
              {submitting ? "Saving..." : editingRoute ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Route"
        message={`Are you sure you want to delete route "${deletingRoute?.routeNo}"? This action cannot be undone.`}
      />
    </div>
  );
}
