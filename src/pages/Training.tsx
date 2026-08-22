import { Button, Input } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { ChevronLeft, Filter, Search } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import React, { useMemo, useState } from "react";
import Errorbox from "../components/Errorbox";
import EventCard from "../components/EventCard";
import Loading from "../components/Loading";
import { api } from "../lib/api";
import { courseCategories } from "../lib/data";
import { GenericError, GenericResponse } from "../lib/types";
import { formatDate } from "../lib/utils";
import Header from "@/components1/Header";

export type StudentTraining = {
  id: string;
  title: string;
  coverImg: string;
  startDate: string;
  endDate: string;
  description: string;
  createdAt: string;
  category?: string;
  instructor: {
    firstName: string;
    lastName?: string;
    institutionName?: string;
  };
  link?: string;
  cost: string;
  location?: string;
  isEnrolled: boolean;
  displayFeedback: boolean;
  ratings: {
    feedback: string;
    rating: number;
    completedOn: string;
  }[];
  enrolments: {
    id: string;
    userId: string;
    trainingId: string;
    completedOn: string | null;
    createdAt: string;
    updatedAt?: string;
    certificateNo?: string;
    certificate?: string;
    transactions?: {
      amount: string;
      status: string;
    }[];
  }[];
  type: "ONLINE" | "OFFLINE" | "HYBRID";
  lessons: {
    id: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    title: string;
    location: string | null;
    type: "ONLINE" | "OFFLINE";
    trainingId: string | null;
    content: string | null;
    video: string | null;
    lastDate: Date | null;
  }[];
};

function useTrainings() {
  return useQuery<
    { [key: string]: StudentTraining[] } | object,
    AxiosError<GenericError>
  >({
    queryKey: ["trainings"],
    queryFn: async () => {
      const raw = (
        await api().get<GenericResponse<StudentTraining[]>>("/trainings")
      ).data;
      if (!raw || !raw.data || !(raw.data.length > 0)) return {};

      /**
       * Chronological, earliest first. The API returns newest-first and this
       * only grouped by month, so the catalogue read backwards. Sorted here so
       * the page stays right regardless of how the endpoint is ordered.
       */
      const undated: StudentTraining[] = [];
      const dated: StudentTraining[] = [];

      for (const tra of raw.data) {
        const start = dayjs(tra.startDate);
        (tra.startDate && start.isValid() ? dated : undated).push(tra);
      }

      dated.sort(
        (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
      );

      const arranged = dated.reduce(
        (acc, tra) => {
          const date = dayjs(tra.startDate).format("MMM, YYYY");
          if (!acc[date]) acc[date] = [];
          acc[date].push(tra);
          return acc;
        },
        {} as { [key: string]: StudentTraining[] },
      );

      // A missing date previously produced a heading of "Invalid Date".
      if (undated.length > 0) {
        arranged["Date to be announced"] = undated;
      }

      return arranged;
    },
    staleTime: 1000 * 60 * 10,
  });
}

const Training: React.FC = () => {
  const { data: trainings, isLoading, error } = useTrainings();
  const [trainingFilter, setTrainingFilter] = useQueryState<string[] | null>(
    "filter",
    {
      defaultValue: null,
      parse(value) {
        return Array.isArray(value) ? value : value ? [value] : null;
      },
      clearOnDefault: true,
    },
  );
  const [filterByMe, setFilterByMe] = useQueryState<boolean>(
    "me",
    parseAsBoolean,
  );

  /** For searching and filtering training data */
  const [search, setSearch] = useState<string>("");

  const filteredTrainings = useMemo(() => {
    if (!trainings) return {};
    return Object.keys(trainings).reduce(
      (acc, key) => {
        const filtered = (
          trainings[key as keyof typeof trainings] as StudentTraining[]
        ).filter(
          (tra) =>
            tra.title.toLowerCase().includes(search.toLowerCase()) &&
            (trainingFilter &&
            Array.isArray(trainingFilter) &&
            trainingFilter.length > 0
              ? trainingFilter.includes(tra.category ?? "")
              : true) &&
            (filterByMe
              ? tra.enrolments.some(
                  (enr) =>
                    enr.transactions &&
                    enr.transactions.filter((tr) => tr.status === "success")
                      .length > 0,
                )
              : true),
        );
        if (filtered.length > 0) acc[key] = filtered;
        return acc;
      },
      {} as { [key: string]: StudentTraining[] },
    );
  }, [search, trainings, trainingFilter, filterByMe]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Errorbox message={error.message} />;
  }

  return (
    
    <div className="w-full mt-4 px-6">
      <Header />
      <div className="max-w-7xl mx-auto flex flex-col justify-center items-center">
        <div className="mt-5">
          <h1 className="font-semibold text-[20px] sm:text-2xl md:text-2xl lg:text-3xl relative inline-block">
            Upcoming Seminars & Webinars
          </h1>
        </div>
        <div className="flex justify-between lg:flex-row flex-col gap-3 items-center w-full py-5">
          {!filterByMe ? (
            <div className="filters flex lg:flex-row flex-col gap-2 text-sm">
              <Filter color="gray" />
              <div className="lg:flex grid grid-cols-2 w-full gap-2">
                {courseCategories.map((category) => (
                  <Button
                    variant={
                      !trainingFilter?.includes(category) ? "outline" : "filled"
                    }
                    size="compact-xs"
                    key={category}
                    className="lg:w-[unset] w-full"
                    onClick={() =>
                      setTrainingFilter((prev) =>
                        !prev
                          ? [category]
                          : prev.includes(category)
                            ? prev.filter((x) => x !== category)
                            : [...prev, category],
                      )
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <Button radius={999} onClick={() => setFilterByMe(null)}>
              <ChevronLeft size={16} />
              Show all
            </Button>
          )}
          <Input
            leftSection={<Search size={16} />}
            classNames={{ wrapper: "lg:ml-auto w-full lg:w-72" }}
            placeholder="Search for training..."
            type="search"
            radius={999}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
        <div className="w-full flex flex-col items-center justify-center mt-2">
          {!filteredTrainings ? (
            <Errorbox message="Something went wrong!" />
          ) : Object.keys(filteredTrainings).length === 0 ? (
            <p>No search results found!</p>
          ) : (
            Object.keys(filteredTrainings).map((month) => (
              <div key={month} className="w-full">
                <h2 className="font-semibold text-xl sm:text-xl md:text-2xl lg:text-3xl md:ml-20 md:mb-5 mt-5 text-left mb-4 relative inline-block">
                  {month}
                  <span className="underline absolute bottom-0 left-0 w-full h-[3px] bg-blue-500 rounded-sm"></span>
                </h2>

                <div className="flex flex-wrap gap-4 justify-center">
                  {(
                    filteredTrainings[
                      month as keyof typeof filteredTrainings
                    ] as StudentTraining[]
                  )
                    // .filter((event) =>
                    //   event.enrolments.some(
                    //     (enr) =>
                    //       enr.transactions &&
                    //       enr.transactions.filter(
                    //         (tr) => tr.status === "success",
                    //       ).length > 0,
                    //   ),
                    // )
                    .map((event) => (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        title={event.title}
                        date={formatDate(event.startDate)}
                        location={event.location}
                        posterUrl={event.coverImg}
                        price={event.cost}
                        category={event.category}
                        isEnrolled={event.enrolments.some(
                          (enr) =>
                            enr.transactions &&
                            enr.transactions.filter(
                              (tr) => tr.status === "success",
                            ).length > 0,
                        )}
                      />
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Training;
