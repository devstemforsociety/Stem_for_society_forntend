import { Badge, Button, Group, Input, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Errorbox from "../../components/Errorbox";
import Loading from "../../components/Loading";
import Table from "../../components/Table";
import { api } from "../../lib/api";
import {
  EnquiryTransactionType,
  GenericError,
  GenericResponse,
} from "../../lib/types";
import { formatDate } from "../../lib/utils";

/**
 * Paid Basics / Premium plans taken through /enquiry/plans.
 *
 * Distinct from "Institution Applications", which lists institution *enquiries*.
 * Nothing read institution_plan at all before this, so schools paid 20,000 or
 * 40,000 and no admin surface could show the booking.
 */
export type AdminInstitutionPlanBooking = {
  id: string;
  schoolName: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
  studentsCount: number | null;
  selectedDate: string | null;
  selectedTime: string | null;
  address: {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  } | null;
  transactions: {
    id: string;
    plan: "Basics" | "Premium";
    transactionId: string;
    transaction: EnquiryTransactionType;
  }[];
};

function useAdminInstitutionPlanBookings() {
  return useQuery<
    GenericResponse<AdminInstitutionPlanBooking[]>,
    AxiosError<GenericError>
  >({
    queryKey: ["admin", "enquiry", "inst-plan-bookings"],
    queryFn: async () =>
      (await api("adminAuth").get("/admin/applications/institution-plan-bookings"))
        .data,
    staleTime: 1000 * 60 * 5,
  });
}

const STATUS_COLOR: Record<string, string> = {
  success: "green",
  pending: "yellow",
  failed: "red",
  cancelled: "gray",
};

export default function AdminInstitutionPlanBookings() {
  const { data, isLoading, error } = useAdminInstitutionPlanBookings();
  const [search, setSearch] = useState("");

  const bookings = useMemo(() => {
    const all = data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((b) =>
      [b.schoolName, b.contactName, b.contactEmail, b.contactMobile]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const exportToCSV = () => {
    if (!bookings.length) return;
    const headers = [
      "S.No", "School", "Contact", "Email", "Mobile", "Students", "Plan",
      "Session Date", "Session Time", "City", "State", "Amount",
      "Payment Status", "Order ID",
    ];
    const rows = bookings.map((b, i) => {
      const txn = b.transactions?.[0];
      return [
        i + 1,
        b.schoolName,
        b.contactName,
        b.contactEmail,
        b.contactMobile,
        b.studentsCount ?? "N/A",
        txn?.plan ?? "N/A",
        b.selectedDate ?? "N/A",
        b.selectedTime ?? "N/A",
        b.address?.city ?? "N/A",
        b.address?.state ?? "N/A",
        txn?.transaction?.amount ?? "N/A",
        txn?.transaction?.status ?? "N/A",
        txn?.transaction?.orderId ?? "N/A",
      ];
    });
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const url = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `institution-plan-bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) return <Loading />;
  if (error) return <Errorbox message={error.message} />;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Institution Plan Bookings
            </h1>
            <Text size="sm" c="dimmed" className="text-gray-500">
              Total: {bookings.length} bookings
            </Text>
          </div>
          <Group className="flex-wrap">
            <Input
              leftSection={<Search size={18} />}
              radius="md"
              placeholder="Search school, contact, mobile..."
              type="search"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              className="w-full sm:w-80"
              classNames={{ input: "h-10" }}
            />
            <Button
              leftSection={<Download size={18} />}
              variant="outline"
              radius="md"
              onClick={exportToCSV}
              disabled={!bookings.length}
              className="h-10"
            >
              Export CSV
            </Button>
          </Group>
        </div>

        <Table
          emptyMessage={
            search
              ? "No bookings match that search."
              : "No institution plans have been booked yet."
          }
          headers={[
            { id: "sno", render: "#" },
            { id: "school", render: "School" },
            { id: "contact", render: "Contact" },
            { id: "plan", render: "Plan" },
            { id: "students", render: "Students" },
            { id: "session", render: "Session" },
            { id: "amount", render: "Amount" },
            { id: "status", render: "Payment" },
          ]}
          rows={bookings.map((b, i) => {
            const txn = b.transactions?.[0];
            const status = txn?.transaction?.status ?? "pending";
            return {
              id: b.id,
              cells: [
                { render: i + 1 },
                {
                  render: (
                    <div>
                      <div className="font-medium text-gray-900">{b.schoolName}</div>
                      {b.address?.city && (
                        <div className="text-xs text-gray-500">
                          {[b.address.city, b.address.state].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  render: (
                    <div>
                      <div className="text-gray-900">{b.contactName}</div>
                      <div className="text-xs text-gray-500">{b.contactEmail}</div>
                      <div className="text-xs text-gray-500">{b.contactMobile}</div>
                    </div>
                  ),
                },
                {
                  render: txn?.plan ? (
                    <Badge variant="light" color={txn.plan === "Premium" ? "violet" : "blue"}>
                      {txn.plan}
                    </Badge>
                  ) : (
                    "N/A"
                  ),
                },
                { render: b.studentsCount ?? "N/A" },
                {
                  render: b.selectedDate ? (
                    <div>
                      <div>{b.selectedDate}</div>
                      {b.selectedTime && (
                        <div className="text-xs text-gray-500">{b.selectedTime}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">Not scheduled</span>
                  ),
                },
                { render: txn?.transaction?.amount ? `₹${txn.transaction.amount}` : "N/A" },
                {
                  render: (
                    <Badge variant="light" color={STATUS_COLOR[status] ?? "gray"}>
                      {status}
                    </Badge>
                  ),
                },
              ],
            };
          })}
        />
      </div>
    </div>
  );
}

/** Re-exported so the schedules page can reuse the same query and cache entry. */
export { useAdminInstitutionPlanBookings, formatDate };
