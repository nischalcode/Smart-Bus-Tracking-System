"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { fetchApi, BannerData, BannersResponse } from "@/utils/api";
import DataTable, { Column } from "@/component/ui/DataTable";
import PageHeader from "@/component/ui/PageHeader";
import Modal from "@/component/ui/Modal";
import ConfirmDialog from "@/component/ui/ConfirmDialog";
import LoadingSpinner from "@/component/ui/LoadingSpinner";

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  link: z.string().optional(),
  active: z.boolean(),
  order: z.number().int().min(0),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export default function BannersPage() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<BannerData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { active: true, order: 0 },
  });

  const fetchBanners = () => {
    fetchApi<BannersResponse>("/banners", {}, token ?? undefined)
      .then((res) => setBanners(res.banners))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, [token]);

  const openCreate = () => {
    setEditingBanner(null);
    reset({ title: "", subtitle: "", image: "", link: "", active: true, order: 0 });
    setShowModal(true);
  };

  const openEdit = (banner: BannerData) => {
    setEditingBanner(banner);
    reset({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      image: banner.image ?? "",
      link: banner.link ?? "",
      active: banner.active,
      order: banner.order,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: BannerFormData) => {
    setSubmitting(true);
    try {
      if (editingBanner) {
        await fetchApi(
          `/banners/${editingBanner._id}`,
          { method: "PUT", body: JSON.stringify(data) },
          token ?? undefined
        );
      } else {
        await fetchApi(
          "/banners",
          { method: "POST", body: JSON.stringify(data) },
          token ?? undefined
        );
      }
      setShowModal(false);
      reset();
      fetchBanners();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (banner: BannerData) => {
    setDeletingBanner(banner);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    try {
      await fetchApi(
        `/banners/${deletingBanner._id}`,
        { method: "DELETE" },
        token ?? undefined
      );
      setShowDeleteConfirm(false);
      setDeletingBanner(null);
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<BannerData & Record<string, unknown>>[] = [
    {
      key: "image",
      label: "Image",
      render: (item) => {
        const b = item as unknown as BannerData;
        return b.image ? (
          <img src={b.image} alt={b.title} className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
            <span className="text-xs text-gray-400">N/A</span>
          </div>
        );
      },
    },
    { key: "title", label: "Title", searchable: true },
    { key: "link", label: "Link" },
    { key: "order", label: "Order" },
    {
      key: "active",
      label: "Active",
      render: (item) => {
        const b = item as unknown as BannerData;
        return b.active ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            ✓
          </span>
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            ✗
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (item) => {
        const b = item as unknown as BannerData;
        return new Date(b.createdAt).toLocaleDateString();
      },
    },
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description="Manage homepage banners"
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#22a34a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c8a3e]"
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </button>
        }
      />

      <DataTable
        data={banners as unknown as (BannerData & Record<string, unknown>)[]}
        columns={columns}
        onEdit={(item) => openEdit(item as unknown as BannerData)}
        onDelete={(item) => confirmDelete(item as unknown as BannerData)}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBanner ? "Edit Banner" : "Add Banner"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              {...register("title")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subtitle
            </label>
            <input
              {...register("subtitle")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Image URL
            </label>
            <input
              {...register("image")}
              placeholder="https://example.com/image.jpg"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Link
            </label>
            <input
              {...register("link")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("active")}
              id="active"
              className="h-4 w-4 rounded border-gray-300 text-[#22a34a] focus:ring-[#22a34a]"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Order
            </label>
            <input
              type="number"
              {...register("order", { valueAsNumber: true })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#22a34a] focus:outline-none focus:ring-1 focus:ring-[#22a34a] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
              {submitting ? "Saving..." : editingBanner ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Banner"
        message={`Are you sure you want to delete banner "${deletingBanner?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
