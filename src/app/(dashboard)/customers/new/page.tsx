// src/app/(dashboard)/customers/new/page.tsx
// Page to create a new customer.

import CustomerForm from "@/components/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      <CustomerForm />
    </div>
  );
}
