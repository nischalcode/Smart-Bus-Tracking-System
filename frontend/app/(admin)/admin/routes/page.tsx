"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Route as RouteIcon, Milestone, Gauge, MapPin } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { fetchApi, RouteData, RouteResponse, NamedStop, RouteStop, BusData, BusesResponse } from "@/utils/api";
import PageHeader from "@/component/ui/PageHeader";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import LoadingSpinner from "@/component/ui/LoadingSpinner";
import StatsCard from "@/component/ui/StatsCard";
import RouteMapPicker from "@/component/admin/RouteMapPicker";
import RouteCards from "@/component/admin/RouteCards";

const routeSchema = z.object({
  routeNo: z.string().min(1, "Route number is required"),
  from: z.string().min(1, "From is required"),
  to: z.string().min(1, "To is required"),
  via: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  status: z.string(),
  active: z.boolean(),
  assignedBuses: z.array(z.string()).default([]),
});

type RouteFormData = z.input<typeof routeSchema>;

export default function RoutesPage() {
  const { token } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewingRoute, setViewingRoute] = useState<RouteData | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stopEntries, setStopEntries] = useState<Array<{ name: string; lat: string; lng: string }>>([
    { name: "", lat: "", lng: "" },
  ]);

  const { register, handleSubmit, reset, watch, control } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: { active: true, assignedBuses: [] },
  });

  const assignedBuses = watch("assignedBuses");

  const updateStopEntry = (index: number, field: "name" | "lat" | "lng", value: string) => {
    const updated = [...stopEntries];
    updated[index][field] = value;
    setStopEntries(updated);
  };

  const addEmptyStopEntry = () => {
    setStopEntries([...stopEntries, { name: "", lat: "", lng: "" }]);
  };

  const removeStopEntry = (index: number) => {
    setStopEntries(stopEntries.filter((_, i) => i !== index));
  };

  const addStopsManually = () => {
    const validStops: NamedStop[] = [];

    for (let i = 0; i < stopEntries.length; i++) {
      const entry = stopEntries[i];
      
      if (!entry.name.trim() && !entry.lat && !entry.lng) {
        continue; // Skip empty entries
      }

      if (!entry.name.trim()) {
        alert(`Stop ${i + 1}: Please enter a stop name`);
        return;
      }

      const lat = parseFloat(entry.lat);
      const lng = parseFloat(entry.lng);

      if (isNaN(lat) || isNaN(lng)) {
        alert(`Stop ${i + 1}: Please enter valid latitude and longitude`);
        return;
      }

      validStops.push({ name: entry.name, lat, lng });
    }

    if (validStops.length === 0) {
      alert("Please enter at least one stop");
      return;
    }

    setNamedStops([...namedStops, ...validStops]);
    setStopEntries([{ name: "", lat: "", lng: "" }]);
  };

  const removeStop = (index: number) => {
    setNamedStops(namedStops.filter((_, i) => i !== index));
  };

  const fetchData = async () => {
    try {
      const [rRes, bRes] = await Promise.all([
         fetchApi<{ routes: RouteData[] }>("/routes", {}, token ?? undefined),
         fetchApi<BusesResponse>("/buses", {}, token ?? undefined)
      ]);
      setRoutes(rRes.routes);
      setBuses(bRes.buses || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [token]);

  const openCreate = () => {
    setEditingRoute(null);
    setNamedStops([]);
    reset({ routeNo: "", from: "", to: "", frequency: "", status: "On Time", active: true, assignedBuses: [] });
    setShowModal(true);
  };

  const openEdit = (route: RouteData) => {
    setEditingRoute(route);
    setNamedStops(
      (route.stops || [])
        .filter((s): s is RouteStop & NamedStop => typeof s.lat === "number" && typeof s.lng === "number")
        .map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }))
    );
    reset({
      routeNo: route.routeNo,
      from: route.from,
      to: route.to,
      via: route.via ?? "",
      frequency: route.frequency,
      status: route.status ?? "On Time",
      active: route.active,
      assignedBuses: (route.assignedBuses || (route.assignedBus ? [route.assignedBus] : [])).map((b) =>
        typeof b === "string" ? b : (b as any)._id
      ),
    });
    setShowModal(true);
  };

  const openView = (route: RouteData) => {
  setViewingRoute(route);
};

const confirmDelete = (route: RouteData) => {
  setDeletingRoute(route);
};

const deleteRoute = async () => {
  if (!deletingRoute) return;

  setDeleting(true);

    try {
      await fetchApi(
        `/routes/${deletingRoute._id}`,
        {
          method: "DELETE",
        },
        token ?? undefined
      );

      setDeletingRoute(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete route");
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (data: RouteFormData) => {
    if (namedStops.length < 2 && !editingRoute) {
      alert("Please add at least 2 named stops on the map.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        ...data,
        assignedBuses: data.assignedBuses || [],
      };

      if (namedStops.length >= 2) {
          payload.pathCoordinates = namedStops.map((s) => [s.lat, s.lng]);
          payload.stops = namedStops.map((s, i) => ({ name: s.name, lat: s.lat, lng: s.lng, type: i === 0 ? "start" : i === namedStops.length - 1 ? "end" : "stop" }));
          payload.namedStops = payload.stops;
      }

      if (editingRoute) {
        await fetchApi(`/routes/${editingRoute._id}`, { method: "PUT", body: JSON.stringify(payload) }, token ?? undefined);
      } else {
        await fetchApi("/routes", { method: "POST", body: JSON.stringify(payload) }, token ?? undefined);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };
  
  const availableBuses = buses.filter((b) => {
    if (!b.routeAssigned) return true;
    if (!editingRoute) return false;
    const currentRouteBusIds = (editingRoute.assignedBuses || (editingRoute.assignedBus ? [editingRoute.assignedBus] : [])).map((bus) =>
      typeof bus === "string" ? bus : (bus as any)._id
    );
    return currentRouteBusIds.includes(b._id);
  });

  const activeBusCount = (routeId: string) => {
    const route = routes.find((r) => r._id === routeId);
    const assigned = (route?.assignedBuses || (route?.assignedBus ? [route.assignedBus] : [])) as any[];
    return assigned.filter((bus) => bus && (typeof bus === "string" ? true : true)).length;
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Route Network"
        title="Routes"
        action={
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Route
          </button>
        }
      />

      <RouteCards routes={routes} activeBusCount={activeBusCount} onView={openView} onEdit={openEdit} onDelete={confirmDelete} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRoute ? "Edit Route" : "Add Route"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="block text-sm">Route No</label><input {...register("routeNo")} className="mt-1 w-full rounded-lg border p-2" /></div>
            <div><label className="block text-sm">Frequency</label><input {...register("frequency")} className="mt-1 w-full rounded-lg border p-2" /></div>
            <div><label className="block text-sm">From</label><input {...register("from")} className="mt-1 w-full rounded-lg border p-2" /></div>
            <div><label className="block text-sm">To</label><input {...register("to")} className="mt-1 w-full rounded-lg border p-2" /></div>
          </div>
          
          <div className="p-3 border rounded-lg bg-muted/10 space-y-3">
            <label className="block text-sm font-semibold">Assign buses</label>
            <Controller
              name="assignedBuses"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availableBuses.map((bus) => (
                    <label key={bus._id} className="flex items-center gap-2 cursor-pointer rounded-lg p-2 hover:bg-background/50">
                      <input
                        type="checkbox"
                        checked={(field.value || []).includes(bus._id)}
                        onChange={(e) => {
                          const currentValue = field.value || [];
                          if (e.target.checked) {
                            field.onChange([...currentValue, bus._id]);
                          } else {
                            field.onChange(currentValue.filter((id) => id !== bus._id));
                          }
                        }}
                        className="rounded border p-1"
                      />
                      <span className="text-sm">
                        {bus.busNumber} ({bus.capacity ?? "—"} seats)
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
            {availableBuses.length === 0 && (
              <p className="text-xs text-muted-foreground">No buses available to assign.</p>
            )}
            <p className="text-xs text-muted-foreground">Click to select buses that will operate on this route.</p>
          </div>

          <div>
             <RouteMapPicker value={namedStops} onChange={setNamedStops} />
          </div>

          <div className="p-3 border rounded-lg bg-muted/10 space-y-3">
            <label className="block text-sm font-semibold">Add Multiple Stops Manually</label>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stopEntries.map((entry, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-4 p-2 border rounded-lg bg-background/50">
                  <div>
                    <label className="block text-xs text-muted-foreground">Stop {index + 1} Name</label>
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => updateStopEntry(index, "name", e.target.value)}
                      placeholder="e.g., Main Station"
                      className="mt-1 w-full rounded-lg border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground">Latitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={entry.lat}
                      onChange={(e) => updateStopEntry(index, "lat", e.target.value)}
                      placeholder="e.g., 27.7172"
                      className="mt-1 w-full rounded-lg border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground">Longitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={entry.lng}
                      onChange={(e) => updateStopEntry(index, "lng", e.target.value)}
                      placeholder="e.g., 85.324"
                      className="mt-1 w-full rounded-lg border p-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    {stopEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStopEntry(index)}
                        className="w-full rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={addEmptyStopEntry}
                className="flex-1 rounded-lg border border-accent px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
              >
                + Add Another Stop
              </button>
              <button
                type="button"
                onClick={addStopsManually}
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Add All Stops
              </button>
            </div>

            {namedStops.length > 0 && (
              <div className="mt-4 space-y-2 pt-3 border-t">
                <label className="block text-xs font-semibold text-muted-foreground">Added Stops ({namedStops.length})</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {namedStops.map((stop, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-background/50 p-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold">{stop.name}</span>
                        <span className="ml-2 text-muted-foreground">({stop.lat.toFixed(5)}, {stop.lng.toFixed(5)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="ml-2 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{submitting ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!viewingRoute}
        onClose={() => setViewingRoute(null)}
        title={
          viewingRoute
            ? `${viewingRoute.from} → ${viewingRoute.to}`
            : "Route"
        }
        size="lg"
      >
        {viewingRoute && (
          <div className="space-y-4">

            <div className="rounded-xl overflow-hidden border">
              <RouteMapPicker
                value={
                  viewingRoute.stops
                    ?.filter((stop): stop is RouteStop & NamedStop => typeof stop.lat === "number" && typeof stop.lng === "number")
                    .map((stop) => ({
                      name: stop.name,
                      lat: stop.lat as number,
                      lng: stop.lng as number,
                    })) || []
                }
                onChange={() => {}}
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">

              <div>
                <span className="font-semibold">Route No:</span>
                <p>{viewingRoute.routeNo}</p>
              </div>

              <div>
                <span className="font-semibold">Status:</span>
                <p>{viewingRoute.status}</p>
              </div>

              <div>
                <span className="font-semibold">Frequency:</span>
                <p>{viewingRoute.frequency}</p>
              </div>

              <div>
                <span className="font-semibold">Stops:</span>
                <p>{viewingRoute.stops?.length || 0}</p>
              </div>

            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        isOpen={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
        onConfirm={deleteRoute}
        title="Delete Route"
        message={
          deletingRoute
            ? `Are you sure you want to delete Route ${deletingRoute.routeNo}?`
            : ""
        }
      />
    </div>
  );
}
