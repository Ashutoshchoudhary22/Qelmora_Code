import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import {
  AccountLayout,
  ProfileSection,
  AddressesSection,
  OrdersList,
  OrderDetailPage,
} from './pages/AccountPage';
import { AboutPage, ContactPage, CollectionsPage } from './pages/StaticPages';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminBanners from './pages/admin/AdminBanners';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop/:category" element={<ShopPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="account" element={<AccountLayout />}>
          <Route index element={<ProfileSection />} />
          <Route path="addresses" element={<AddressesSection />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:orderNumber" element={<OrderDetailPage />} />
        </Route>
      </Route>

      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="banners" element={<AdminBanners />} />
      </Route>

      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
