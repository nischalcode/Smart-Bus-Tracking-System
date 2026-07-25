"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { IoLogoLinkedin, IoLogoFacebook, IoLogoInstagram, IoMail } from "react-icons/io5";
import { useState, useEffect } from "react";
import { fetchApi, type TeamData, type TeamResponse } from "@/utils/api";

const TeamSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [members, setMembers] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<TeamResponse>("/teams")
      .then((res) => setMembers(res.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleMembers = showAll ? members : members.slice(0, 4);

  if (loading) {
    return (
      <section className="space-y-6 pb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meet the Team</h2>
          <p className="mt-1 text-sm text-gray-500">
            The passionate people behind Smart Bus Tracking System
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-gray-200" />
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Meet the Team</h2>
        <p className="mt-1 text-sm text-gray-500">
          The passionate people behind Smart Bus Tracking System
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {visibleMembers.map((member) => (
          <div
            key={member._id}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start gap-4">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  width={56}
                  height={56}
                  className="rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg font-bold text-gray-400">
                  {member.name.charAt(0)}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </div>

            <p className="flex-1 text-xs leading-6 text-gray-600">
              {member.description}
            </p>

            <div className="mt-5 flex items-center gap-2">
              {member.linkedin && member.linkedin !== "#" && (
                <Link
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition hover:bg-blue-200"
                >
                  <IoLogoLinkedin className="h-4 w-4" />
                </Link>
              )}
              {member.facebook && member.facebook !== "#" && (
                <Link
                  href={member.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[#1877f2] transition hover:bg-blue-200"
                >
                  <IoLogoFacebook className="h-4 w-4" />
                </Link>
              )}
              {member.instagram && member.instagram !== "#" && (
                <Link
                  href={member.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition hover:bg-pink-200"
                >
                  <IoLogoInstagram className="h-4 w-4" />
                </Link>
              )}
              {member.email && (
                <Link
                  href={`mailto:${member.email}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                >
                  <IoMail className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length > 4 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            {showAll ? "Show Less" : "View All Team Members"}
            <ChevronRight
              className={`h-4 w-4 transition-transform ${showAll ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      )}
    </section>
  );
};

export default TeamSection;
