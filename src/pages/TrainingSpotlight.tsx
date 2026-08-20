import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { clientSafeText } from "@/lib/errors";
import { Alert, Badge, Button, Rating, Textarea } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Calendar, ChevronLeft, NotepadText } from "lucide-react";
import { useCallback, useState } from "react";
import { FaLinkedin } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdShare } from "react-icons/md";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useShare } from "@/hooks/useShare";
import { SharePopup } from "@/components1/ui/SharePopup";
import Errorbox from "../components/Errorbox";
import Loading from "../components/Loading";
import { RZPY_KEYID } from "../Constants";
import { api, queryClient } from "../lib/api";
import { useUser } from "../lib/hooks";
import RazorpayInstance, {
  GenericError,
  GenericResponse,
  RazorpayOrderOptions,
} from "../lib/types";
import {
  formatDate,
  initializeRazorpay,
  mutationErrorHandler,
} from "../lib/utils";
import { StudentTraining } from "./Training";
import ReactPlayer from "react-player";

function useTraining(id?: string) {
  return useQuery<GenericResponse<StudentTraining>, AxiosError<GenericError>>({
    queryKey: ["trainings", id],
    queryFn: async () => (await api().get(`/trainings/${id}`)).data,
    staleTime: 1000 * 60 * 10,
  });
}

export type CreatePaymentResponse = {
  amount: string;
  orderId: string;
};

type FeedbackResponse = {
  rating: number;
  feedback: string;
};

function useEnroll(id?: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const loginUrl = `/login?returnTo=${encodeURIComponent(
    `${location.pathname}${location.search}${location.hash}`
  )}`;
  return useMutation<
    GenericResponse<CreatePaymentResponse>,
    AxiosError<GenericError>
  >({
    mutationFn: async () =>
      (await api().post(`/payments/create`, { trainingId: id })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (err) => mutationErrorHandler(err, navigate, loginUrl),
  });
}

function useSubmitFeedback(id: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const loginUrl = `/login?returnTo=${encodeURIComponent(
    `${location.pathname}${location.search}${location.hash}`
  )}`;
  return useMutation<
    GenericResponse,
    AxiosError<GenericError>,
    FeedbackResponse
  >({
    mutationFn: async ({ rating, feedback }: FeedbackResponse) => {
      const response = await api().post(`/trainings/${id}/feedback`, {
        rating,
        feedback,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainings", id] });
      toast.success(data.message);
    },
    onError: (err) => mutationErrorHandler(err, navigate, loginUrl),
  });
}

function TrainingSpotlight() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { isShowing, handleShare } = useShare();
  const { data, isLoading, error } = useTraining(id);
  const { user } = useUser();
  const { mutateAsync, isPending } = useEnroll(id);
  const loginUrl = `/login?returnTo=${encodeURIComponent(
    `${routerLocation.pathname}${routerLocation.search}${routerLocation.hash}`
  )}`;

  const handlePayment = useCallback(async () => {
    try {
      const rzrpyInit = await initializeRazorpay();
      if (!rzrpyInit) return toast.error("Unable to initialize payment!");
      const data = await mutateAsync();
      console.log("🚀 ~ handlePayment ~ data:", data);
      if (!data.data) {
        toast.error("Something went wrong in creating payment!");
        return;
      }
      const order = data.data;

      const options: RazorpayOrderOptions = {
        key: RZPY_KEYID,
        amount: Number(order.amount) * 100,
        currency: "INR",
        name: "Stem for Society",
        description: "Premium plan purchase",
        image: "https://stem-4-society.netlify.app/logo-01.png",
        order_id: order.orderId,
        prefill: {
          name: user?.user.firstName,
          email: user?.user.email,
          contact: user?.user.mobile,
        },
        async handler(response) {
          try {
            if ("error" in response) {
              console.log("🚀 ~ handler ~ response:", response);
              // @ts-expect-error smh
              toast.error(clientSafeText(response.error.reason));
              queryClient.invalidateQueries({ queryKey: ["trainings"] });
              return;
            }
            toast.success(
              "Payment was made successfully and is being verified. We will get back to you shortly if verification fails",
              { autoClose: false, closeOnClick: false },
            );
          } catch (error) {
            console.log("🚀 ~ handler ~ error:", error);
            toast.error("Payment was made, but it could not be verified");
          }
        },
      };

      // @ts-expect-error dhe chi pae
      const rzp: RazorpayInstance = new Razorpay(options);

      rzp.on("payment.failed", (res) => {
        console.log("Failure:", res);
        toast.error("Payment failed! Reason:\n" + clientSafeText(res.error.description), {
          autoClose: false,
          closeOnClick: false,
        });
        toast.error(
          "Please note Order ID: " +
            res.error.metadata.order_id +
            "\n Payment ID: " +
            res.error.metadata.payment_id,
          { autoClose: false, closeOnClick: false },
        );
      });

      rzp.open();
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          toast.error("Please login again");
          return;
        }
      }
      console.log("🚀 ~ handlePayment ~ error:", error);
      // toast.error("Something went wrong in the paymnent process");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Errorbox message={error.message} />;
  }

  const event = data?.data;

  return (
    <div className="w-full my-8 h-full flex justify-center">
      <div className="lg:w-[80%] lg:p-0 p-3 mb-10 flex flex-col gap-4">
        <Link to={"/courses"}>
          <Button radius={999}>
            <ChevronLeft size={16} />
            Back
          </Button>
        </Link>
        {!event ? (
          <Errorbox message="Something went wrong!" />
        ) : (
          <>
            <span className=" text-xl md:text-3xl flex justify-between">
              {event.title}
              <Button
                radius={999}
                variant="outline"
                onClick={handleShare}
              >
                <MdShare />
                Share
              </Button>
            </span>
            {event.description}
            <div className="flex gap-4 lg:flex-row flex-col">
              <img
                src={event.coverImg}
                alt={event.title}
                className="lg:w-2/3 aspect-video object-contain rounded-lg"
              />
              <div className="flex flex-col gap-2">
                <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
                  Instructor:{" "}
                  <span className="date ml-2 text-black font-semibold">
                    {event.instructor.firstName +
                      " " +
                      (event.instructor.lastName ?? "")}
                  </span>
                </span>
                {event.instructor.institutionName && (
                  <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
                    Institution:{" "}
                    <span className="date ml-2 text-black font-semibold">
                      {event.instructor.institutionName}
                    </span>
                  </span>
                )}
                {event.enrolments?.length === 1 && event.link && (
                  <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
                    Enrolled On:{" "}
                    <span className="date ml-2 text-black font-semibold">
                      {formatDate(event.enrolments?.[0]?.createdAt)}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <span className="text-green-600 flex items-center gap-2 font-semibold text-xs sm:text-sm md:text-base">
              <Calendar size={18} />
              Dates:{" "}
              <span className="date ml-2 text-black font-semibold">
                {formatDate(event.startDate) +
                  " to " +
                  formatDate(event.endDate)}
              </span>
            </span>
            <span className="text-green-600 flex items-center gap-2 font-semibold text-xs sm:text-sm md:text-base">
              <FaLocationDot /> Mode:{" "}
              <span className=" text-black font-normal">
                <Badge variant="dot" color={location ? "red" : "green"}>
                  {event.type ?? (event.location ? "Offline" : "Online")}
                </Badge>
              </span>
            </span>
            {event.location && (
              <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
                Location:{" "}
                <span className="location text-black font-semibold">
                  {event.location}
                </span>
              </span>
            )}
            {event.isEnrolled && (
              <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
                Event Link:{" "}
                <a
                  href={event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="location text-blue-500 underline font-semibold"
                >
                  {event.link}
                </a>
              </span>
            )}
            <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
              Price:{" "}
              <span className="date ml-2 text-black font-semibold">
                ₹{event.cost}
              </span>
            </span>
            <div className="">
              {!user ? (
                <Link to={loginUrl}>
                  <Button
                    radius={999}
                    variant="filled"
                    px={20}
                    leftSection={<NotepadText size={14} />}
                  >
                    Sign in to register
                  </Button>
                </Link>
              ) : !event.isEnrolled ? (
                <Button
                  radius={999}
                  variant="filled"
                  leftSection={<NotepadText size={14} />}
                  onClick={handlePayment}
                  disabled={isPending}
                  px={20}
                >
                  {isPending ? "Please wait..." : "Proceed to register"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    radius={999}
                    variant="filled"
                    leftSection={<NotepadText size={14} />}
                    className="px-4 py-2 text-sm"
                    disabled
                  >
                    You are already registered
                  </Button>
                  {event.displayFeedback && (
                    <RatingAndFeedback
                      data={event}
                      id={id!}
                      disabled={event.ratings.length > 0}
                    />
                  )}
                </div>
              )}
              {event.lessons && event.lessons.length > 0 && (
                <div className="grid gap-3 mt-8">
                  <span className="text-green-600 font-semibold text-xs sm:text-sm md:text-base">
                    Course Content
                  </span>
                  {event.lessons.map((l) => (
                    <div
                      className="w-full border my-1 rounded-md p-4"
                      key={l.id}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold">{l.title}</h4>
                        <Badge
                          variant="dot"
                          color={l.type === "ONLINE" ? "red" : "green"}
                        >
                          {l.type}
                        </Badge>
                      </div>
                      {l.content && (
                        <div
                          className="ql-snow"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(l.content) }}
                        ></div>
                      )}
                      <div className="flex flex-col mb-2 gap-3">
                        <span className="text-gray-600">
                          <Calendar size={16} className="inline-block mr-1" />
                          {formatDate(l.lastDate)}
                        </span>
                        {l.type === "ONLINE" && l.video && (
                          <div className="pt-[56.25%] relative">
                            <ReactPlayer
                              url={l.video}
                              controls
                              height={"100%"}
                              width={"100%"}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {l.type === "OFFLINE" && l.location && (
                        <div className="text-gray-600">
                          <FaLocationDot
                            size={16}
                            className="inline-block mr-1"
                          />
                          {l.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {event.enrolments?.[0]?.certificate && (
                <>
                  <Alert color="green" className="mt-4">
                    <h4 className="font-medium text-green-600 text-xl">
                      Congratulations! You have successfully completed the
                      training
                    </h4>
                    <p className="text-green-700">
                      You have earned a certificate and is now available for you
                      to download!
                    </p>
                    <div className="flex gap-2">
                      <Button radius={999} mt={8}>
                        <Link
                          target="_blank"
                          to={event.enrolments?.[0]?.certificate}
                        >
                          Download now
                        </Link>
                      </Button>
                      <Button radius={999} mt={8}>
                        <Link
                          target="_blank"
                          className="flex gap-2"
                          to={`https://www.linkedin.com/shareArticle?mini=true&url=${event.enrolments?.[0]?.certificate}&text=Hello connections! I have completed a course with STEM for society website and have earned a certificate on ${event.title}`}
                        >
                          <FaLinkedin /> Share
                        </Link>
                      </Button>
                    </div>
                  </Alert>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <SharePopup isVisible={isShowing} />
    </div>
  );
}

function RatingAndFeedback({
  id,
  data,
  disabled,
}: {
  id: string;
  data: StudentTraining;
  disabled?: boolean;
}) {
  const [rating, setRating] = useState<number>(
    data.ratings ? data.ratings[0]?.rating : 0,
  );
  const [feedback, setFeedback] = useState<string>(
    data.ratings ? data.ratings[0]?.feedback : "",
  );
  const mutation = useSubmitFeedback(id as string);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ rating, feedback });
  };

  return (
    <>
      <Rating
        value={rating}
        onChange={setRating}
        className={disabled ? "opacity-80 pointer-events-none" : ""}
      />
      <Textarea
        rows={5}
        value={feedback}
        className={disabled ? "opacity-80 pointer-events-none" : ""}
        onChange={(event) => setFeedback(event.currentTarget.value)}
        placeholder="Enter feedback to apply for certificate"
      />
      <Button
        radius={999}
        onClick={handleSubmit}
        disabled={data.ratings?.length > 0 || mutation.isPending}
      >
        {data.ratings?.length > 0 ? "Already submitted" : "Submit feedback"}
      </Button>
    </>
  );
}

export default TrainingSpotlight;
