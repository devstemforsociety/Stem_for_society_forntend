import { Badge, Group, SegmentedControl, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CalendarClock } from "lucide-react";
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
import { AdminInstitutionPlanBooking } from "./AdminInstitutionPlanBookings";

/**
 * Every booked meeting slot in one place.
 *
 * This route existed but rendered the literal string "AdminSchedules". The
 * bookings it needs were already being fetched by two separate application
 * screens, each showing its own slice; nothing answered "what is coming up".
 *
 * Both queries reuse the exact query keys the applications screens use, so this
 * page reads from the same React Query cache rather than refetching.
 */

type IndividualEnquiry = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  organizationName: string | null;
  serviceInterest: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  transactions: {
    transaction: EnquiryTransactionType;
  }[];
};

function useIndividualEnquiries() {
  return useQuery<GenericResponse<IndividualEnquiry[]>, AxiosError<GenericError>>({
    queryKey: ["admin", "enquiry", "individual"],
    queryFn: async () =>
      (await api("adminAuth").get("/admin/applications/individual")).data,
    staleTime: 1000 * 60 * 5,
  });
}

function usePlanBookings() {
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

type ScheduleRow = {
  id: string;
  kind: "Individual" | "Institution";
  who: string;
  contact: string;
  detail: string;
  date: string;
  time: string;
  paid: boolean;
  /** Epoch ms, or null when the slot could not be parsed. */
  sortKey: number | null;
};

/**
 * Slots are stored as free text ("2023-10-15" plus "10:30 AM"), so parsing is
 * best effort. Anything unparseable keeps its raw strings for display and sorts
 * last rather than being dropped - a booking nobody can see is worse than one
 * in an odd position.
 */
function toEpoch(date: string | null, time: string | null): number | null {
  if (!date) return null;
  const parsed = Date.parse(time ? `${date} ${time}` : date);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function AdminSchedules() {
  const individual = useIndividualEnquiries();
  const plans = usePlanBookings();
  const [range, setRange] = useState<"upcoming" | "past" | "all">("upcoming");

  const rows = useMemo<ScheduleRow[]>(() => {
    const out: ScheduleRow[] = [];

    for (const e of individual.data?.data ?? []) {
      if (!e.selectedDate) continue;
      out.push({
        id: `ind-${e.id}`,
        kind: "Individual",
        who: e.name,
        contact: e.email || e.mobile,
        detail: e.serviceInterest || e.organizationName || "-",
        date: e.selectedDate,
        time: e.selectedTime || "-",
        paid: e.transactions?.[0]?.transaction?.status === "success",
        sortKey: toEpoch(e.selectedDate, e.selectedTime),
      });
    }

    for (const b of plans.data?.data ?? []) {
      if (!b.selectedDate) continue;
      const txn = b.transactions?.[0];
      out.push({
        id: `plan-${b.id}`,
        kind: "Institution",
        who: b.schoolName,
        contact: b.contactEmail || b.contactMobile,
        detail: txn?.plan ? `${txn.plan} plan` : "Institution plan",
        date: b.selectedDate,
        time: b.selectedTime || "-",
        paid: txn?.transaction?.status === "success",
        sortKey: toEpoch(b.selectedDate, b.selectedTime),
      });
    }

    const now = Date.now();
    const filtered = out.filter((r) => {
      if (range === "all" || r.sortKey === null) return true;
      return range === "upcoming" ? r.sortKey >= now : r.sortKey < now;
    });

    return filtered.sort((a, b) => {
      if (a.sortKey === null) return 1;
      if (b.sortKey === null) return -1;
      // Upcoming reads soonest-first; history reads most-recent-first.
      return range === "past" ? b.sortKey - a.sortKey : a.sortKey - b.sortKey;
    });
  }, [individual.data, plans.data, range]);

  if (individual.isLoading || plans.isLoading) return <Loading />;

  const failure = individual.error || plans.error;
  if (failure) return <Errorbox message={failure.message} />;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <CalendarClock className="h-7 w-7 text-[#0389FF]" aria-hidden="true" />
              Schedules
            </h1>
            <Text size="sm" c="dimmed" className="text-gray-500">
              {rows.length} booked {rows.length === 1 ? "slot" : "slots"}
            </Text>
          </div>
          <Group>
            <SegmentedControl
              value={range}
              onChange={(v) => setRange(v as typeof range)}
              data={[
                { label: "Upcoming", value: "upcoming" },
                { label: "Past", value: "past" },
                { label: "All", value: "all" },
              ]}
            />
          </Group>
        </div>

        <Table
          emptyMessage={
            range === "upcoming"
              ? "Nothing is scheduled yet."
              : "No sessions in this range."
          }
          headers={[
            { id: "when", render: "When" },
            { id: "kind", render: "Type" },
            { id: "who", render: "Who" },
            { id: "detail", render: "Booking" },
            { id: "paid", render: "Payment" },
          ]}
          rows={rows.map((r) => ({
            id: r.id,
            cells: [
              {
                render: (
                  <div>
                    <div className="font-medium text-gray-900">{r.date}</div>
                    <div className="text-xs text-gray-500">{r.time}</div>
                  </div>
                ),
              },
              {
                render: (
                  <Badge
                    variant="light"
                    color={r.kind === "Institution" ? "violet" : "blue"}
                  >
                    {r.kind}
                  </Badge>
                ),
              },
              {
                render: (
                  <div>
                    <div className="text-gray-900">{r.who}</div>
                    <div className="text-xs text-gray-500">{r.contact}</div>
                  </div>
                ),
              },
              { render: r.detail },
              {
                render: (
                  <Badge variant="light" color={r.paid ? "green" : "yellow"}>
                    {r.paid ? "Paid" : "Unpaid"}
                  </Badge>
                ),
              },
            ],
          }))}
        />
      </div>
    </div>
  );
}
