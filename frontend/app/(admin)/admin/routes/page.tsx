"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Route as RouteIcon, Milestone, Gauge, MapPin } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { fetchApi, RouteData, RouteResponse } from "@/utils/api";
import PageHeader from "@/component/ui/PageHeader";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import LoadingSpinner from "@/component/ui/LoadingSpinner";
import StatsCard from "@/component/ui/StatsCard";
import RouteMapPicker from "@/component/admin/RouteMapPicker";
import RouteCards from "@/component/admin/RouteCards";
import MapView from "@/component/LiveTracking/MapView";
import { useLiveTracking } from "@/hooks/useLiveTracking";

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

function haversineKm([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function routeDistanceKm(coords: [number, number][]) {
  if (!coords || coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineKm(coords[i - 1], coords[i]);
  return total;
}

export default function RoutesPage() {
  const { token } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState<RouteData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [search, setSearch] = useState("");
  const [viewingRoute, setViewingRoute] = useState<RouteData | null>(null);

  const { tracking } = useLiveTracking();

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
    fetchApi<{ success: boolean; routes: RouteData[] }>("/routes", {}, token ?? undefined)
      .then((res) => setRoutes(res.routes))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    setEditingRoute(null);
    setCoordinates([]);
    reset({ routeNo: "", from: "", to: "", via: "", frequency: "", status: "On Time", active: true, pathCoordinatesText: "" });
    setShowModal(true);
  };

  const openEdit = (route: RouteData) => {
    setEditingRoute(route);
    setCoordinates(route.pathCoordinates ?? []);
    reset({
      routeNo: route.routeNo,
      from: route.from,
      to: route.to,
      via: route.via ?? "",
      frequency: route.frequency,
      status: route.status ?? "On Time",
      active: route.active,
      pathCoordinatesText: route.pathCoordinates?.length ? JSON.stringify(route.pathCoordinates) : "",
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
        pathCoordinates: coordinates,
      };

      if (editingRoute) {
        await fetchApi<RouteResponse>(
          `/routes/${editingRoute._id}`,
          { method: "PUT", body: JSON.stringify(payload) },
          token ?? undefined
        );
      } else {
        await fetchApi<RouteResponse>(
          "/routes",
          { method: "POST", body: JSON.stringify(payload) },
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
      await fetchApi(`/routes/${deletingRoute._id}`, { method: "DELETE" }, token ?? undefined);
      setShowDeleteConfirm(false);
      setDeletingRoute(null);
      fetchRoutes();
    } catch (err) {
      console.error(err);
    }
  };

  const activeBusCount = (routeId: string) =>
    tracking.filter((t) => t.route?._id === routeId).length;

  const summary = useMemo(() => {
    const activeRoutes = routes.filter((r) => r.active).length;
    const totalDistance = routes.reduce(
      (sum, r) => sum + routeDistanceKm(r.pathCoordinates),
      0
    );
    const totalStops = routes.reduce((sum, r) => sum + (r.stops?.length ?? 0), 0);
    return { activeRoutes, totalDistance, totalStops };
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return routes;
    const q = search.toLowerCase();
    return routes.filter(
      (r) =>
        r.routeNo.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q)
    );
  }, [routes, search]);

  const viewingCoords = viewingRoute?.pathCoordinates ?? [];
  const viewingTracking = viewingRoute
    ? tracking.find((t) => t.route?._id === viewingRoute._id)
    : undefined;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Route Network"
        title="Routes"
        description="Map, monitor and manage every route in your network."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Add Route
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={RouteIcon} label="Total Routes" value={routes.length} tone="primary" />
        <StatsCard icon={Gauge} label="Active Routes" value={summary.activeRoutes} tone="accent" />
        <StatsCard
          icon={Milestone}
          label="Network Distance"
          value={`${summary.totalDistance.toFixed(0)} km`}
          tone="info"
        />
        <StatsCard icon={MapPin} label="Total Stops" value={summary.totalStops} tone="neutral" />
      </div>

      <div className="relative max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by route no, origin or destination..."
          className="w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <RouteCards
        routes={filteredRoutes}
        activeBusCount={activeBusCount}
        onView={(route) => setViewingRoute(route)}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoute ? "Edit Route" : "Add Route"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Route No</label>
              <input
                {...register("routeNo")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.routeNo && <p className="mt-1 text-xs text-danger">{errors.routeNo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Frequency</label>
              <input
                {...register("frequency")}
                placeholder="e.g. every 15 min"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.frequency && <p className="mt-1 text-xs text-danger">{errors.frequency.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">From</label>
              <input
                {...register("from")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.from && <p className="mt-1 text-xs text-danger">{errors.from.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">To</label>
              <input
                {...register("to")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {errors.to && <p className="mt-1 text-xs text-danger">{errors.to.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Via</label>
              <input
                {...register("via")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Status</label>
              <input
                {...register("status")}
                placeholder="On Time"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                )}
              />
              Active
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Path Coordinates</label>
            <p className="mb-2 text-xs text-muted-foreground">
              Click on the map to plot the route path (minimum 2 points).
            </p>
            <RouteMapPicker value={coordinates} onChange={setCoordinates} />
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
              {submitting ? "Saving..." : editingRoute ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Map Modal */}
      <Modal
        isOpen={!!viewingRoute}
        onClose={() => setViewingRoute(null)}
        title={viewingRoute ? `${viewingRoute.routeNo} • ${viewingRoute.from} → ${viewingRoute.to}` : "Route Map"}
        size="lg"
      >
        <div className="h-96 overflow-hidden rounded-xl">
          <MapView
            center={viewingCoords[0]}
            routeCoordinates={viewingCoords}
            routeLabel={viewingRoute ? `${viewingRoute.from} → ${viewingRoute.to}` : undefined}
            showBus={!!viewingTracking}
            busPosition={
              viewingTracking ? [viewingTracking.latitude, viewingTracking.longitude] : undefined
            }
            busName={viewingTracking?.bus?.busNumber || "Bus"}
            speed={viewingTracking?.speed}
            eta={viewingTracking?.eta}
            nextStop={viewingTracking?.nextStop}
          />
        </div>
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
