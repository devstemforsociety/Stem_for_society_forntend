import { clientSafeText } from "@/lib/errors";
import {
  Alert,
  Badge,
  Button,
  Modal,
  NumberInput,
  TextInput,
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { RZPY_KEYID } from "../Constants";
import { api } from "../lib/api";
import {
  GenericError,
  GenericResponse,
  RazorpayOrderOptions,
} from "../lib/types";
import { initializeRazorpay, mutationErrorHandler } from "../lib/utils";
import { CreatePaymentResponse } from "./TrainingSpotlight";
import { Asterisk } from "lucide-react";

type InstitutionSignUpForm = {
  schoolName: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  studentsCount: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  plan?: "Basics" | "Premium";
};

function useInsitutionSignUp() {
  return useMutation<
    GenericResponse<CreatePaymentResponse>,
    AxiosError<GenericError>,
    InstitutionSignUpForm,
    unknown
  >({
    mutationFn: async (data) => {
      const response = await api().post("/enquiry/plans", data);
      return response.data;
    },
    onError: (err) => mutationErrorHandler(err),
  });
}

export default function PricingPage() {
  const [regModalData, setregModalData] = useState<{
    open: boolean;
    plan?: "Basics" | "Premium";
  }>({ open: false });
  const [formData, setFormData] = useState<InstitutionSignUpForm>({
    schoolName: "",
    contactName: "",
    contactMobile: "",
    contactEmail: "",
    studentsCount: 0,
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const { isPending, mutateAsync: signUp, data } = useInsitutionSignUp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = useCallback(async () => {
    try {
      const rzrpyInit = await initializeRazorpay();
      if (!rzrpyInit) return toast.error("Unable to initialize payment!");

      if (
        !Object.keys(formData).every(
          (field) => formData[field as keyof InstitutionSignUpForm],
        )
      ) {
        toast.error("Please fill in all fields");
        return;
      }

      await signUp({ ...formData, plan: regModalData.plan });

      console.log("🚀 ~ handlePayment ~ data:", data);

      if (!data || !data.data) {
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
          name: formData.contactName + "-" + formData.schoolName,
          email: formData.contactEmail,
          contact: formData.contactMobile,
        },
        async handler() {
          try {
            setregModalData({ open: false });
            toast.success(
              "Payment was made successfully! We will verify the payment and will be in touch with you shortly",
              { autoClose: false, draggable: false },
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
  }, [formData, signUp, regModalData.plan, data]);

  return (
    <section className="bg-gray-50 py-12">
      {/* Registration modal */}
      <Modal
        opened={regModalData.open}
        transitionProps={{
          transition: "fade",
        }}
        w={800}
        title={"Register as institution"}
        onClose={() => setregModalData((prev) => ({ ...prev, open: false }))}
      >
        <div className="flex flex-col gap-2 w-full">
          <p>Please fill up the details and we will be in touch</p>
          <TextInput
            label="School name"
            placeholder="Enter your school name"
            size="sm"
            className="w-full"
            required
            name="schoolName"
            value={formData.schoolName}
            onChange={handleChange}
          />
          <TextInput
            label="Contact name"
            placeholder="Enter contact person name"
            size="sm"
            className="w-full"
            required
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
          />
          <TextInput
            label="Contact Mobile No."
            placeholder="Enter contact person mobile number"
            size="sm"
            className="w-full"
            required
            name="contactMobile"
            value={formData.contactMobile}
            onChange={handleChange}
          />
          <TextInput
            label="Email Address"
            placeholder="Enter contact person email"
            size="sm"
            type="email"
            className="w-full"
            required
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
          />
          <TextInput
            label="Address Line 1"
            placeholder=""
            size="sm"
            className="w-full"
            required
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
          />
          <TextInput
            label="Address Line 2"
            placeholder=""
            size="sm"
            className="w-full"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
          />
          <TextInput
            label="City"
            placeholder=""
            size="sm"
            className="w-full"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
          />
          <TextInput
            label="State"
            placeholder=""
            size="sm"
            className="w-full"
            name="state"
            required
            value={formData.state}
            onChange={handleChange}
          />
          <TextInput
            label="Pincode"
            placeholder=""
            size="sm"
            className="w-full"
            name="pincode"
            type="number"
            required
            value={formData.pincode}
            onChange={handleChange}
          />
          <NumberInput
            label="Students count"
            placeholder="Number of students"
            size="sm"
            className="w-full"
            name="studentsCount"
            required
            value={formData.studentsCount}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, studentsCount: Number(value) }))
            }
          />
          <Alert classNames={{ message: "text-blue-600" }} icon={<Asterisk />}>
            If you have any queries or clarification reach out to us on mail ID
          </Alert>
          <Button disabled={isPending} onClick={handlePayment}>
            Submit
          </Button>
        </div>
      </Modal>

      <div className="container mx-auto px-4 lg:w-[60%]">
        {/* Header */}
        <h2 className="text-3xl font-semibold text-gray-800 text-center mb-4">
          Plans & Pricing
        </h2>
        <p className="text-center text-gray-600 mb-10">
          Plans for Schools, Institutions and Universities STEM for Society
          initiatives in universities and institutions aim to enhance the
          industrial gaps. By fostering collaboration between academia and
          industry, these programs encourage innovation and practical learning.
          They focus on diverse outreach, mentorship opportunities, and hands-on
          projects, preparing students for future careers in STEM by addressing
          societal challenges
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Plan */}
          <div className="border flex flex-col rounded-lg p-6 shadow-sm bg-white">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                {/* Icon Placeholder */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 ml-3">
                Basics
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Essential Skills to Shape a Promising Future.
            </p>
            <p className="text-3xl font-semibold text-gray-800 mb-6">
              ₹20,000 <span className="text-base font-medium">per year</span>
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Career
                Counselling
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Psychology
                Counselling
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Time Management
                Training
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Personality
                Development
              </li>
            </ul>
            <button
              onClick={() => setregModalData({ open: true, plan: "Basics" })}
              className="w-full mt-auto py-2 px-4 border border-blue-600 text-blue-600 font-semibold rounded-md hover:bg-blue-100"
            >
              Get Started
            </button>
          </div>

          {/* Premium Plan */}
          <div className="border flex flex-col rounded-lg p-6 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
                {/* Icon Placeholder */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
              <h3 className="text-xl flex gap-3 items-center font-semibold text-gray-800 ml-3">
                Premium
                <Badge>Best offer</Badge>
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Comprehensive Training for a Brighter Tomorrow.
            </p>
            <p className="text-3xl font-semibold text-gray-800 mb-6">
              ₹40,000 <span className="text-base font-medium">per year</span>
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Career
                Counselling
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Psychology
                Counselling
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Sex Education
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Entrepreneurship
                Training
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Personality
                Development
              </li>
              <li className="flex items-center text-gray-700">
                <span className="text-green-500 mr-2">✔</span> Industrial Visit
              </li>
            </ul>
            <button
              onClick={() => setregModalData({ open: true, plan: "Premium" })}
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
