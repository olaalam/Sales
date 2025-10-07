import { useLocation, Link } from "react-router-dom";
import {
  Home,
  Users,
  Target,
  Wallet,
  ShoppingBag,
  Gift,
  Trophy,
  Handshake,
  Activity,
  Banknote,
  Layers,
  MapPin,
  Building,
  Map,
  ChevronDown,
  BarChart3,
  CreditCard,
  FileBox,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useState } from "react";

const navItems = [
  { label: "Users", to: "/users", icon: <Users size={20} /> },
  { label: "Targets", to: "/target", icon: <Target size={20} /> },
  { label: "Sources", to: "/source", icon: <Layers size={20} /> },
  { label: "Activities", to: "/activity", icon: <Activity size={20} /> },
  { label: "PaymentMethod", to: "/payment-method", icon: <CreditCard size={20} /> },
  { label: "Products", to: "/product", icon: <ShoppingBag size={20} /> },
  { label: "Offers", to: "/offer", icon: <Gift size={20} /> },
  { label: "Leaders", to: "/leader", icon: <Trophy size={20} /> },
  { label: "Sales", to: "/sale", icon: <BarChart3 size={20} /> },
  { label: "Lead", to: "/lead", icon: <Handshake size={20} /> },
  { label: "Payment", to: "/payment", icon: <Wallet size={20} /> },
  { label: "Popup", to: "/pop", icon: <FileBox size={20} /> },
  { label: "SalesManagement", to: "/sales-management", icon: <Banknote size={20} /> },
  { label: "Commission", to: "/commission", icon: <Layers size={20} /> },
  {
    label: "Locations",
    icon: <MapPin size={20} />,
    children: [
      { label: "City", to: "/city", icon: <Building size={18} /> },
      { label: "Country", to: "/country", icon: <Map size={18} /> },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const isSidebarOpen = true;
  const [openGroup, setOpenGroup] = useState(null);

  const handleGroupClick = (label) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  return (
    <Sidebar className="bg-teal-600 !me-20 border-none sm:border-none rounded-tr-4xl rounded-br-4xl overflow-x-hidden !pb-10 !pt-10 h-full shadow-lg transition-all duration-300">
      <SidebarContent
        className="bg-teal-600 !p-6 text-white mt-10 border-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <SidebarGroup>
          <SidebarGroupLabel className="text-white text-3xl font-semibold flex flex-col justify-center items-center text-center !mb-3">
            Sales
            <hr className="w-1/2 mx-auto border-white !mt-3 !mb-6" />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="list-none p-0 bg-teal-600 flex flex-col gap-3">
              {navItems.map((item) => {
                if (item.children) {
                  const isGroupOpen = openGroup === item.label;
                  return (
                    <SidebarGroup key={item.label} className="!mb-3">
                      <SidebarMenuButton
                        onClick={() => handleGroupClick(item.label)}
                        className={`flex justify-between items-center gap-3 !px-4 !py-2 text-white transition-all duration-200 text-sm font-medium w-full
                          ${isSidebarOpen ? "rounded-full" : ""}
                          ${
                            isGroupOpen
                              ? "bg-white text-bg-primary shadow-md"
                              : "hover:bg-white hover:text-bg-primary"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="text-base">{item.label}</span>
                        </div>

                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${
                            isGroupOpen ? "rotate-180" : ""
                          }`}
                        />
                      </SidebarMenuButton>

                      {isGroupOpen && (
                        <SidebarGroupContent className="ps-6 pt-2 pb-2">
                          <SidebarMenu className="flex flex-col gap-2">
                            {item.children.map((childItem) => {
                              const isActive =
                                location.pathname === childItem.to;
                              return (
                                <SidebarMenuItem key={childItem.label}>
                                  <Link to={childItem.to} className="w-full">
                                    <SidebarMenuButton
                                      isActive={isActive}
                                      className={`flex justify-start items-center gap-3 !px-4 !py-2 text-white transition-all duration-200 text-sm font-medium
                                        ${isSidebarOpen ? "rounded-full" : ""}
                                        ${
                                          isActive
                                            ? "bg-white text-bg-primary shadow-md"
                                            : "hover:bg-white hover:text-bg-primary"
                                        }`}
                                    >
                                      {childItem.icon}
                                      <span className="text-base">
                                        {childItem.label}
                                      </span>
                                    </SidebarMenuButton>
                                  </Link>
                                </SidebarMenuItem>
                              );
                            })}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      )}
                    </SidebarGroup>
                  );
                } else {
                  const isActive = location.pathname === item.to;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link to={item.to} className="w-full">
                        <SidebarMenuButton
                          isActive={isActive}
                          className={`flex justify-start items-center gap-3 !px-4 !py-2 text-white transition-all duration-200 text-sm font-medium
                            ${isSidebarOpen ? "rounded-full" : ""}
                            ${
                              isActive
                                ? "bg-white text-bg-primary shadow-md"
                                : "hover:bg-white hover:text-bg-primary"
                            }`}
                        >
                          {item.icon}
                          <span className="text-base">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
