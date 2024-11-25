//import styled from "styled-components";
import GlobalStyles from "./styles/GlobalStyles";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import Schools from "./pages/Schools";
import Statistics from "./pages/Statistics";
import Suppliers from "./pages/Suppliers";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import Users from "./pages/Users";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/Login";
import AppLayout from "./ui/AppLayout";
// import Button from "./ui/Button";
// import Input from "./ui/Input";
// import Heading from "./ui/Heading";
// import Row from "./ui/Row";

// const StyledApp = styled.main`
//   padding: 20px;
// `;

export default function App() {
  return (
    <>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="payments" element={<Payments />} />
            <Route path="register" element={<Register />} />
            <Route path="reports" element={<Reports />} />
            <Route path="schools" element={<Schools />} />
            <Route path="settings" element={<Settings />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="students" element={<Students />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
