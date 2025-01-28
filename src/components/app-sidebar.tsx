"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavTab } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import NavUserSkeleton from "./nav-user-skeleton";
import { Skeleton } from "./ui/skeleton";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    // {
    //   title: "Explore",
    //   url: "#",
    //   icon: SquareTerminal,
    //   isActive: false,
    //   items: [
    //     {
    //       title: "History",
    //       url: "#",
    //     },
    //     {
    //       title: "Starred",
    //       url: "#",
    //     },
    //     {
    //       title: "Settings",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "My collections",
      url: "#",
      icon: Bot,
      isActive: true,
      items: [
        {
          title: "Liked quizes",
          url: "#",
        },
        {
          title: "All quizes",
          url: "#",
        },
      ],
    },
  ],
  tabs: [
    {
      name: "Explore",
      url: "#",
      icon: Frame,
    },
    {
      name: "My collections",
      url: "#",
      icon: PieChart,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAuthenticated, getUser, isLoading } = useKindeBrowserClient();
  const [user, setUser] = React.useState<KindeUser<
    Record<string, string>
  > | null>(null);
  const retrieveUser = async () => {
    const user = await getUser();
    setUser(user);
    console.log("user", user);
  };

  React.useEffect(() => {
    console.log("isAuthenticated", isAuthenticated);
    console.log("isLoading", isLoading);
    if (isAuthenticated && !isLoading) {
      retrieveUser();
    }
  }, [isAuthenticated, isLoading]);

  return isLoading ? (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col h-full px-2">
          <Skeleton className="h-full w-full "></Skeleton>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <Skeleton className="h-12 w-full"></Skeleton>
      </SidebarFooter>
    </Sidebar>
  ) : (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavTab tabs={data.tabs} />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
