"use client";

import Image from "next/image";
import Link from "next/link";
import { IoLogoLinkedin } from "react-icons/io";
import ExpandableList from "@/component/ui/ExpandableList";

const teamMembers = [
  {
    name: "Manish Khadka",
    role: "CEO & Founder",
    description:
      "Passionate about smart mobility and building technology that makes a difference.",
    image: "/team/member1.jpg",
    linkedin: "#",
  },
  {
    name: "Pratik Adhikari",
    role: "CTO & FullStack Developer",
    description:
      "Leads technology and product development with a focus on innovation and scalability.",
    image: "/team/member2.jpg",
    linkedin: "#",
  },
  {
    name: "Nischal Joshi",
    role: "Head of Operations",
    description:
      "Ensures smooth operations and strong partnerships across the transportation network.",
    image: "/team/member3.jpg",
    linkedin: "#",
  },
  {
    name: "Priya Gurung",
    role: "UX/UI Lead Designer",
    description:
      "Designs user-friendly experiences that make commuting simple and enjoyable.",
    image: "/team/member4.jpg",
    linkedin: "#",
  },
  {
    name: "Suman Sharma",
    role: "Mobile App Engineer",
    description:
      "Crafts intuitive mobile interfaces and real-time transit notification flows.",
    image: "/team/member1.jpg",
    linkedin: "#",
  },
  {
    name: "Aarati Thapa",
    role: "Data Analyst & GIS Specialist",
    description:
      "Analyzes transit patterns and route data to optimize bus dispatching schedules.",
    image: "/team/member2.jpg",
    linkedin: "#",
  },
];

const TeamSection = () => {
  return (
    <section className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Meet the Team
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          The passionate people behind Smart Bus Tracking System
        </p>
      </div>

      <ExpandableList
        items={teamMembers}
        initialCount={4}
        showMoreLabel="View All Team Members"
        showLessLabel="Show Fewer Team Members"
      >
        {(visibleMembers) => (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleMembers.map((member, index) => (
              <div
                key={index}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors"
              >
                <div className="mb-4 flex items-start gap-4">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={56}
                    height={56}
                    className="rounded-full border border-border object-cover"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {member.name}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>

                <p className="flex-1 text-xs leading-6 text-muted-foreground">
                  {member.description}
                </p>

                <div className="mt-5">
                  <Link
                    href={member.linkedin}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary transition hover:bg-primary/25"
                  >
                    <IoLogoLinkedin className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </ExpandableList>
    </section>
  );
};

export default TeamSection;