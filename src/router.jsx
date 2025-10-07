import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./Layout/MainLayout";
import { SidebarProvider } from "./components/ui/sidebar";
import ProtAuth from "./Auth/ProtAuth";
import Login from "./components/Login/Login";
import NotFound from "./Pages/NotFound";
import ProtectedRoute from "./Auth/ProtectedRoute";
import AuthLayout from "./Layout/AuthLayout";
import Commission from "./Pages/Commission/Commission";
import SalesManagement from "./Pages/SalesManangement/SalesManagement";
import Payment from "./Pages/Payment/Payment";
import SalesPoint from "./Pages/SalesPoint";
import Lead from "./Pages/Lead/Lead";
import Sale from "./Pages/Sales/Sale";
import Leader from "./Pages/Leader/Leader";
import Offer from "./Pages/Offer/Offer";
import Product from "./Pages/Product/Product";
import PaymentMethod from "./Pages/PaymentMethod/PaymentMethod";
import Activity from "./Pages/Activity/Activity";
import Source from "./Pages/Source/Source";
import Target from "./Pages/Target/Target";
import User from "./Pages/User/User";
import UserAdd from "./Pages/User/UserAdd";
import TargetAdd from "./Pages/Target/TargetAdd";
import SourceAdd from "./Pages/Source/SourceAdd";
import ActivityAdd from "./Pages/Activity/ActivityAdd";
import PayMethodAdd from "./Pages/PaymentMethod/PayMethodAdd";
import ProductAdd from "./Pages/Product/ProductAdd";
import OfferAdd from "./Pages/Offer/OfferAdd";
import LeaderAdd from "./Pages/Leader/LeaderAdd";
import SalesAdd from "./Pages/Sales/SalesAdd";
import LeadAdd from "./Pages/Lead/LeadAdd";
import PaymentAdd from "./Pages/Payment/PaymentAdd";
import CommissionAdd from "./Pages/Commission/CommissionAdd";
import SalesManagementAdd from "./Pages/SalesManangement/SalesManagementAdd";
import City from "./Pages/City/City";
import CityAdd from "./Pages/City/CityAdd";
import Country from "./Pages/Country/Country";
import CountryAdd from "./Pages/Country/CountryAdd";
import Popus from "./Pages/POPUS/Popus";
import PopAdd from "./Pages/POPUS/PopusAdd";
import Home from "./Pages/Home";

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <ProtAuth>
            <Login />
          </ProtAuth>
        ),
      },
    ],
  },

  {
    element: (
      <SidebarProvider>
        <MainLayout />
      </SidebarProvider>
    ),
    children: [
           {
        path: "/",
        element: (
          <ProtectedRoute permissionKey="Home">
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/users",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <User />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <UserAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "target",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Target />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <TargetAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },

      {
        path: "source",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Source />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <SourceAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "activity",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <ActivityAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "payment-method",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <PaymentMethod />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <PayMethodAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "product",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Product />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <ProductAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },

      {
        path: "offer",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Offer />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <OfferAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "leader",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Leader />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <LeaderAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "sale",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Sale />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <SalesAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "lead",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Lead />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <LeadAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },

      {
        path: "sales-point",

        element: (
          <ProtectedRoute>
            <SalesPoint />
          </ProtectedRoute>
        ),
      },
      {
        path: "payment",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <PaymentAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },

      {
        path: "sales-management",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <SalesManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <SalesManagementAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "commission",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Commission />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <CommissionAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "city",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <City />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <CityAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
            {
        path: "country",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Country />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <CountryAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
                  {
        path: "pop",
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <Popus />
              </ProtectedRoute>
            ),
          },
          {
            path: "add",
            element: (
              <ProtectedRoute>
                <PopAdd />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
