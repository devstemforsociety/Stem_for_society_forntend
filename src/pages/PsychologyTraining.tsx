import { Alert, Button, FileInput, TextInput } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { MdDiscount } from "react-icons/md";
import { currencyFormatter, mutationErrorHandler } from "../lib/utils";
import { useMutation } from "@tanstack/react-query";
import { GenericError, GenericResponse } from "../lib/types";
import { AxiosError } from "axios";
import { api } from "../lib/api";
import { toast } from "react-toastify";

//Photo by <a href="https://unsplash.com/@wocintechchat?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Christina @ wocintechchat.com</a> on <a href="https://unsplash.com/photos/shallow-focus-photo-of-woman-in-beige-open-cardigan-rCyiK4_aaWw?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>

type PsychologyTrainingForm = {
  firstName: string;
  lastName?: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  idCard?: File | null;
};

function useRegisterPsychology() {
  return useMutation<
    GenericResponse,
    AxiosError<GenericError>,
    PsychologyTrainingForm,
    unknown
  >({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      if (data.lastName) {
        formData.append("lastName", data.lastName);
      }
      if (data.idCard) {
        formData.append("idCard", data.idCard);
      }
      formData.append("mobile", data.mobile);
      formData.append("email", data.email);
      formData.append("city", data.city);
      formData.append("state", data.state);

      const response = await api().post("/enquiry/psychology", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onError: (err) => mutationErrorHandler(err),
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });
}

export default function PsychologyTraining() {
  const [formData, setFormData] = useState<PsychologyTrainingForm>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    city: "",
    state: "",
  });
  const { isPending, mutate } = useRegisterPsychology();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("🚀 ~ handleSubmit ~ formData:", formData);
    mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 lg:w-[80%] md:w-[60%] my-12 grid gap-7">
      {/* Header */}
      <h2 className="text-3xl font-semibold text-gray-800 text-center mb-4">
        Psychology Counselling
      </h2>

      <div className="grid lg:grid-cols-2">
        <img
          src="/psych.jpg"
          alt="Psychology Counselling"
          className="rounded-xl"
        />
        <div className="p-4 space-y-3">
          <p className="text-justify text-gray-600">
            <span className="font-bold text-pink-800">Stem For Society</span>{" "}
            supports students facing{" "}
            <span className="font-bold text-pink-800">
              psychological challenges
            </span>
            , which is essential for their well-being and academic success. Stem For
            Society, establishing open communication channels allows students to
            express their feelings and seek help without stigma. Providing
            access to counselling services ensures that students receive
            professional support tailored to their needs
          </p>
          <h3 className="font-semibold text-lg text-center">
            Fee: {currencyFormatter.format(2000)} for 30 mins
          </h3>
          <Alert color="green" icon={<MdDiscount size={46} />}>
            <p className="text-green-700 text-base">
              If you have a Valid student (UG/PG/Ph.D) ID card 75% fee will be
              waived off by Stem for Society.
            </p>
          </Alert>
          <Alert>Your Identity will be 100% confidential</Alert>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p>Please fill up the details and we will be in touch</p>
        <TextInput
          label="First name"
          placeholder="Enter your first name"
          size="sm"
          className="w-full"
          required
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />
        <TextInput
          label="Last Name"
          placeholder="Enter last name"
          size="sm"
          className="w-full"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
        <TextInput
          label="Mobile No."
          placeholder="Enter mobile number"
          size="sm"
          className="w-full"
          required
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
        />
        <TextInput
          label="Email Address"
          placeholder="Enter email"
          size="sm"
          type="email"
          className="w-full"
          required
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <TextInput
          label="City"
          size="sm"
          className="w-full"
          name="city"
          placeholder="Enter your city"
          required
          value={formData.city}
          onChange={handleChange}
        />
        <TextInput
          label="State"
          size="sm"
          className="w-full"
          name="state"
          placeholder="Enter your state"
          required
          value={formData.state}
          onChange={handleChange}
        />
        <FileInput
          label="IdCard"
          size="sm"
          className="w-full"
          name="idCard"
          placeholder="Upload ID card as image format only (within 5MB size)"
          onChange={(file) =>
            setFormData((prev) => ({ ...prev, idCard: file }))
          }
        />
        <Button disabled={isPending} onClick={handleSubmit} w={"fit-content"}>
          Submit
        </Button>
        <Alert
          color="yellow"
          classNames={{ message: "text-yellow-800" }}
          icon={<AlertCircle />}
        >
          We will be contacting you within 48 hrs of your registration
        </Alert>
      </div>
    </div>
  );
}
