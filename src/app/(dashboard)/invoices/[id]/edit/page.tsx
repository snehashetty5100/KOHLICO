// src/app/(dashboard)/invoices/[id]/edit/page.tsx
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import InvoiceForm from "@/components/invoice-form";

export default async function EditInvoicePage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, customers, products] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    db.customer.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({ orderBy: { description: "asc" } }),
  ]);

  if (!invoice) notFound();
  if (invoice.deletedAt) redirect("/invoices");
  if (invoice.status === "final") redirect(`/invoices/${id}`);

  const defaultValues = {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    invoiceDate: invoice.invoiceDate.toISOString(),
    proformaInvNo: invoice.proformaInvNo ?? "",
    proformaDate: invoice.proformaDate?.toISOString() ?? "",
    iecCode: invoice.iecCode,
    panNo: invoice.panNo,
    gstinNo: invoice.gstinNo,
    endUseCode: invoice.endUseCode ?? "",
    consigneeId: invoice.consigneeId,
    buyerId: invoice.buyerId ?? "",
    preCarriage: invoice.preCarriage,
    portOfReceipt: invoice.portOfReceipt,
    vesselFlight: invoice.vesselFlight ?? "",
    portOfLoading: invoice.portOfLoading,
    portOfDischarge: invoice.portOfDischarge,
    finalDestination: invoice.finalDestination,
    countryOfOrigin: invoice.countryOfOrigin,
    countryOfDestination: invoice.countryOfDestination,
    termsOfDelivery: invoice.termsOfDelivery,
    exchangeRate: invoice.exchangeRate,
    insuranceCAD: invoice.insuranceCAD ?? undefined,
    status: invoice.status,
    items: invoice.items.map((it) => ({
      productId: it.productId,
      description: it.description,
      hsCode: it.hsCode,
      packageDescription: it.packageDescription,
      marksAndNos: it.marksAndNos,
      quantity: it.quantity,
      rate: it.rate,
      netWeight: it.netWeight,
      grossWeight: it.grossWeight,
      igstRate: it.igstRate,
    })),
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#D8D6D3] pb-6">
        <h1 className="text-3xl font-serif font-bold text-[#1C335E]">Edit Entry</h1>
        <p className="mt-1.5 text-xs text-[#6F7B8E] uppercase tracking-wider font-mono">
          Modify draft fields and items
        </p>
      </div>
      <InvoiceForm
        customers={customers}
        products={products}
        defaultValues={defaultValues}
      />
    </div>
  );
}