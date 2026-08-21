import { Alert, Button, NumberInput, Select, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { GenericError, GenericResponse } from "../lib/types";
import { AxiosError } from "axios";
import { api } from "../lib/api";
import { mutationErrorHandler } from "../lib/utils";
import { toast } from "react-toastify";
import { DateInput } from "@mantine/dates";

const WHY_JOIN_POINTS = [
  "Access to exclusive STEM for Society opportunities and a chance to win a Campus Ambassador Points",
  "Certificates of recognition for your contributions",
  "Opportunities to network with fellow participants and free access to Stem for Society Conference",
  "30% discount in all the program offered by Stem for Society",
];

type EduType = "UG" | "PG" | "PhD";

type CaForm = {
  firstName: string;
  lastName?: string;
  email: string;
  mobile: string;
  eduType: EduType;
  department: string;
  collegeName: string;
  yearInCollege?: number;
  collegeCity: string;
  dob: Date | null;
  linkedin: string;
};

function useCampusAmbSignUp() {
  return useMutation<
    GenericResponse,
    AxiosError<GenericError>,
    CaForm,
    unknown
  >({
    mutationFn: async (data) => {
      const response = await api().post("/enquiry/ca", data);
      return response.data;
    },
    onSuccess(data) {
      toast.success(data.message);
    },
    onError: (err) => mutationErrorHandler(err),
  });
}

export default function CampusAmbassador() {
  const [formData, setFormData] = useState<CaForm>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    eduType: "PG",
    department: "",
    collegeName: "",
    collegeCity: "",
    dob: null,
    linkedin: "",
  });
  const { isPending, mutate } = useCampusAmbSignUp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("🚀 ~ handleSubmit ~ formData:", formData);
    mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 w-[80%] md:w-[60%] my-12 grid gap-7">
      <Alert icon={<HiOutlineSpeakerphone size={30} />} color="orange">
        Stem for Society Campus Ambassador (CA) recruitment
      </Alert>
      <h2 className="text-3xl font-semibold text-gray-800 text-center mb-4">
        Join the Stem for Society Campus Ambassador Program!
      </h2>
      <p className="text-justify text-gray-600">
        Embrace the role of a{" "}
        <span className="font-bold text-pink-800">Stem For Society</span>{" "}
        Campus Ambassador at your college or
        university and help us spread the excitement far and wide! As a Campus
        Ambassador, you will be instrumental in promoting the festival, engaging
        with fellow students, and infusing the spirit of Stem for Society into
        your campus community
      </p>

      <h3 className="font-semibold text-lg">Why Join?</h3>

      <div className="flex flex-col gap-2">
        {WHY_JOIN_POINTS.map((point) => (
          <div className="flex flex-row gap-3 items-center">
            <Check size={13} className="text-green-500 flex-2" />
            <p className="flex gap-4 items-center flex-1">{point}</p>
          </div>
        ))}
      </div>

      <Alert
        title={"Ready to apply?"}
        classNames={{ title: "text-lg", message: "text-blue-700" }}
      >
        Sign up today to embark on this exciting journey. Let’s make Stem for
        Society unforgettable together!
      </Alert>

      <div className="flex flex-col gap-2 w-full">
        <p>Please fill up the details and we will be in touch</p>
        <TextInput
          label="First Name"
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
          placeholder="Enter your last name"
          size="sm"
          className="w-full"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
        <TextInput
          label="Email"
          placeholder="Enter your email"
          size="sm"
          className="w-full"
          required
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <TextInput
          label="Mobile No."
          placeholder="Enter your mobile number"
          size="sm"
          className="w-full"
          required
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
        />
        <Select
          label="Education Type"
          placeholder="Select your education type"
          size="sm"
          className="w-full"
          required
          name="eduType"
          value={formData.eduType}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, eduType: value as EduType }))
          }
          data={[
            { value: "UG", label: "UG" },
            { value: "PG", label: "PG" },
            { value: "PhD", label: "PhD" },
          ]}
        />
        <TextInput
          label="Department"
          placeholder="Enter your department"
          size="sm"
          className="w-full"
          required
          name="department"
          value={formData.department}
          onChange={handleChange}
        />
        <TextInput
          label="College Name"
          placeholder="Enter your college name"
          size="sm"
          className="w-full"
          required
          name="collegeName"
          value={formData.collegeName}
          onChange={handleChange}
        />
        <NumberInput
          label="Year in College"
          placeholder="Enter your year in college"
          size="sm"
          className="w-full"
          name="yearInCollege"
          value={formData.yearInCollege}
          min={1}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, yearInCollege: Number(value) }))
          }
        />
        <TextInput
          label="College City"
          placeholder="Enter your college city"
          size="sm"
          className="w-full"
          required
          name="collegeCity"
          value={formData.collegeCity}
          onChange={handleChange}
        />
        <DateInput
          label="Date of Birth"
          placeholder="Enter your date of birth"
          size="sm"
          className="w-full"
          required
          name="dob"
          value={formData.dob}
          onChange={(e) => setFormData((prev) => ({ ...prev, dob: e }))}
        />
        <TextInput
          label="LinkedIn Profile"
          placeholder="Enter your LinkedIn profile"
          size="sm"
          className="w-full"
          required
          name="linkedin"
          value={formData.linkedin}
          onChange={handleChange}
        />
        <Button className="mt-2" disabled={isPending} onClick={handleSubmit} w={"fit-content"}>
          Submit
        </Button>
      </div>
    </div>
  );
}
