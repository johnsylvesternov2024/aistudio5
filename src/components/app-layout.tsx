'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  LayoutDashboard,
  ListChecks,
  FolderTree,
  PieChart,
  StickyNote,
  Search,
  Calculator,
  Table2,
  TrendingUp,
  BookOpen,
  CalendarDays,
  Bot,
  LogOut,
  User as UserIcon,
  Wallet,
} from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Expenses',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Transactions', href: '/transactions', icon: ListChecks },
      { title: 'Categories', href: '/categories', icon: FolderTree },
      { title: 'Reports', href: '/reports', icon: PieChart },
    ],
  },
  {
    label: 'Notes',
    items: [
      { title: 'Notes', href: '/notes', icon: StickyNote },
      { title: 'Scratch Notes', href: '/scratch-notes', icon: StickyNote },
      { title: 'Stock Notes', href: '/stocknotes', icon: BookOpen },
    ],
  },
  {
    label: 'Tools',
    items: [
      { title: 'Search', href: '/search', icon: Search },
      { title: 'Age Calculator', href: '/age-calculator', icon: Calculator },
      { title: 'Spreadsheet', href: '/spreadsheet', icon: Table2 },
      { title: 'Date Range', href: '/date-range', icon: CalendarDays },
      { title: 'Personal Perplexity', href: '/personal-perplexity', icon: Bot },
    ],
  },
  {
    label: 'Markets',
    items: [
      { title: 'Paytm Portfolio', href: '/paytm-portfolio', icon: Wallet },
      { title: 'Alpha Advantage', href: '/alpha-advantage', icon: TrendingUp },
      { title: 'Magic Formula', href: '/magic-formula', icon: TrendingUp },
      { title: 'Crossover Strategy', href: '/crossover-strategy', icon: TrendingUp },
      { title: 'Stock Predictor', href: '/stock-predictor', icon: TrendingUp },
      { title: 'Paytm Money Int', href: '/paytmmoneyint', icon: Wallet },
    ],
  },
  {
    label: 'Dates',
    items: [
      { title: 'Chennai Dates', href: '/chennai-dates', icon: CalendarDays },
      { title: 'Pondy Dates', href: '/pondy-dates', icon: CalendarDays },
    ],
  },
  {
    label: 'Other',
    items: [
      { title: 'AppSheet', href: '/appsheet', icon: Table2 },
    ],
  },
];

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) {
    return null;
  }

  const name = session.user.name ?? 'User';
  const email = session.user.email ?? '';
  const image = session.user.image ?? '';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Avatar className="h-7 w-7">
            {image ? <AvatarImage src={image} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-left">{name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{name}</span>
          {email ? <span className="text-xs font-normal text-muted-foreground">{email}</span> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            signOut({ callbackUrl: '/login' });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Fiscal Flow</span>
                  <span className="truncate text-xs text-muted-foreground">Personal Finance</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex-1" />
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <SessionProvider>
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <SidebarProvider>
        <SidebarNav />
        <SidebarInset>
          <TopBar />
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
