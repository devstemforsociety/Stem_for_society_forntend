import React, { useState, createContext, useContext } from "react";
import { Button } from "@/components1/ui/button";
import { Input } from "@/components1/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components1/ui/select";
import { ArrowLeft, Share2, Upload, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components1/Header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { api, queryClient } from "../lib/api";
import { GenericError, GenericResponse } from "../lib/types";
import { mutationErrorHandler } from "../lib/utils";
import { useUser } from "../lib/hooks";
import RichTextEditorNew from "../components/RichTextEditorNew.client";

// Type definitions matching your existing structure
export type AuthorDetails = {
  name: string;
  phoneNumber: string;
  emailAddress: string;
  linkedInProfileUrl: string;
  designation: string;

  //Only For Frontend.. Not sends to backend
  educationLevel: string;
  department: string;
  fieldExperience?: string;
};

export type BlogContentType = {
  references?: string[];
  title: string;
  content: string;
  category: string; // Add category field
};

type BlogDetailsForm = BlogContentType & AuthorDetails & { coverImage: File };

interface FormData extends AuthorDetails, BlogContentType {
  coverPhoto: File | null;
}

// Context for Blog Stepper
interface BlogStepperContextType {
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  setActive: (step: number) => void;
}

const BlogStepperContext = createContext<BlogStepperContextType | undefined>(
  undefined,
);

const BlogStepperProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const setActive = (step: number) => {
    setCurrentStep(step + 1); // Convert 0-based to 1-based indexing
  };

  return (
    <BlogStepperContext.Provider
      value={{ currentStep, nextStep, prevStep, setActive }}
    >
      {children}
    </BlogStepperContext.Provider>
  );
};

const useBlogStepper = () => {
  const context = useContext(BlogStepperContext);
  if (context === undefined) {
    throw new Error("useBlogStepper must be used within a BlogStepperProvider");
  }
  return context;
};

// Custom hook for creating blog (matching your existing API structure)
function useCreateBlog() {
  const navigate = useNavigate();
  return useMutation<
    GenericResponse,
    AxiosError<GenericError>,
    BlogDetailsForm,
    unknown
  >({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("authorName", data.name);
      formData.append("authorMobile", data.phoneNumber);
      formData.append("authorEmail", data.emailAddress);
      formData.append("authorLinkedin", data.linkedInProfileUrl);
      formData.append("authorDesignation", data.designation);
      formData.append("coverImage", data.coverImage);
      formData.append("content", data.content);
      formData.append("references", JSON.stringify(data.references ?? []));
      formData.append("title", data.title);
      formData.append("category", data.category);

      const response = await api().post("/blogs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        toast.error(
          "You need to be signed in to publish an article. Sign in and your details will still be here.",
          { autoClose: false },
        );
        return;
      }
      mutationErrorHandler(error);
    },
    onSuccess: () => {
      toast.success("Blog creation successful");
      navigate("/blog");
    },
  });
}

const BlogCreateContent = () => {
  const { currentStep, nextStep, prevStep, setActive } = useBlogStepper();
  const { mutate: createBlog, isPending } = useCreateBlog();

  // Query existing data from cache (matching your structure)
  const { data: blogAuthorDetails } = useQuery<AuthorDetails | undefined>({
    queryKey: ["blog", "authorDetails"],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: blogContent } = useQuery<BlogContentType | undefined>({
    queryKey: ["blog", "content"],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Publishing requires an account; the banner below says so up front.
  const { user } = useUser();

  const [formData, setFormData] = useState<FormData>({
    // Author Details
    name: blogAuthorDetails?.name || "",
    phoneNumber: blogAuthorDetails?.phoneNumber || "",
    emailAddress: blogAuthorDetails?.emailAddress || "",
    linkedInProfileUrl: blogAuthorDetails?.linkedInProfileUrl || "",
    designation: blogAuthorDetails?.designation || "",
    fieldExperience: "",
    educationLevel: blogAuthorDetails?.educationLevel || "",
    department: blogAuthorDetails?.department || "",
    // Blog Content
    title: blogContent?.title || "",
    content: blogContent?.content || "",
    references: blogContent?.references || [],
    category: blogContent?.category || "", // Add category field
    // Blog Details
    coverPhoto: null,
  });

  const steps = [
    { number: 1, title: "Author Information", active: currentStep === 1 },
    { number: 2, title: "Article Content", active: currentStep === 2 },
    { number: 3, title: "Preview & Upload", active: currentStep === 3 },
  ];

  const handleInputChange = (
    field: string,
    value: string | File | null | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, coverPhoto: file }));
    }
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      // Validate author details
      const missing = (
        [
          ["Full name", formData.name],
          ["Phone number", formData.phoneNumber],
          ["Email address", formData.emailAddress],
          ["LinkedIn profile URL", formData.linkedInProfileUrl],
          ["Designation", formData.designation],
          ["Education level", formData.educationLevel],
          ["Department", formData.department],
          ["Field experience", formData.fieldExperience],
        ] as [string, string][]
      )
        .filter(([, value]) => !String(value ?? "").trim())
        .map(([label]) => label);

      if (missing.length > 0) {
        toast.error(
          missing.length === 1
            ? `${missing[0]} is required.`
            : `Still needed: ${missing.join(", ")}.`,
        );
        return;
      }
      if (formData.name.trim().length < 5) {
        toast.error("AuthorName: Name must be at least 5 characters long");
        return;
      }
      if (formData.name.trim().length > 50) {
        toast.error("AuthorName: Name must be at most 50 characters long");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
        toast.error("AuthorEmail: Invalid email");
        return;
      }
      if (formData.phoneNumber.replace(/\D/g, "").length < 10) {
        toast.error("AuthorMobile: Mobile number is invalid");
        return;
      }
      try {
        const url = new URL(formData.linkedInProfileUrl);
        if (!url.hostname.includes("linkedin.com")) {
          toast.error("AuthorLinkedin: Only valid linkedin links are allowed");
          return;
        }
      } catch (e) {
        toast.error("AuthorLinkedin: Invalid URI");
        return;
      }

      // Save author details to cache and proceed
      const authorDetails: AuthorDetails = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        emailAddress: formData.emailAddress,
        linkedInProfileUrl: formData.linkedInProfileUrl,
        designation: formData.designation,
        educationLevel: formData.educationLevel,
        department: formData.department,
      };
      queryClient.setQueryData(["blog", "authorDetails"], authorDetails);
      nextStep();
    } else if (currentStep === 2) {
      // Validate blog content
      if (
        !formData.title ||
        !formData.content ||
        !formData.category ||
        (formData.content.replace(/<(.|\n)*?>/g, "").trim() === "" &&
          !formData.content.includes("<img"))
      ) {
        toast.error("Please provide title, category, and content");
        return;
      }

      // Save blog content to cache and proceed
      const blogContentData: BlogContentType = {
        title: formData.title,
        content: formData.content,
        references: formData.references,
        category: formData.category, // Include category
      };
      queryClient.setQueryData(["blog", "content"], blogContentData);
      nextStep();
    } else if (currentStep === 3) {
      // Submit the blog
      handleSubmit();
    } else if (currentStep < 4) {
      nextStep();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    }
  };

  const handleSubmit = async () => {
    if (!formData.coverPhoto) {
      toast.error("Cover Image is required");
      return;
    }

    const blogData: BlogDetailsForm = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      emailAddress: formData.emailAddress,
      linkedInProfileUrl: formData.linkedInProfileUrl,
      designation: formData.designation,
      educationLevel: formData.educationLevel,
      department: formData.department,
      title: formData.title,
      content: formData.content,
      references: formData.references,
      category: formData.category, // Include category
      coverImage: formData.coverPhoto,
    };

    createBlog(blogData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                aria-label="Full name"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-100 border-0 rounded-lg p-4 h-14"
              />
              <Input
                aria-label="Phone number"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                className="bg-gray-100 border-0 rounded-lg p-4 h-14"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                aria-label="Email address"
                placeholder="Email Address"
                type="email"
                value={formData.emailAddress}
                onChange={(e) =>
                  handleInputChange("emailAddress", e.target.value)
                }
                className="bg-gray-100 border-0 rounded-lg p-4 h-14"
              />
              <Input
                aria-label="LinkedIn profile URL"
                placeholder="LinkedIn Profile URL"
                type="url"
                value={formData.linkedInProfileUrl}
                onChange={(e) =>
                  handleInputChange("linkedInProfileUrl", e.target.value)
                }
                className="bg-gray-100 border-0 rounded-lg p-4 h-14"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                onValueChange={(value) =>
                  handleInputChange("educationLevel", value)
                }
                value={formData.educationLevel}
              >
                <SelectTrigger className="bg-gray-100 border-0 rounded-lg p-4 h-14">
                  <SelectValue placeholder="Education Level" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    zIndex: 50,
                    position: "relative",
                    backgroundColor: "white",
                  }}
                >
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="postdoc">Post-Doc</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger className="bg-gray-100 border-0 rounded-lg p-4 h-14">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    zIndex: 50,
                    position: "relative",
                    backgroundColor: "white",
                  }} // Add this style
                >
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                onValueChange={(value) =>
                  handleInputChange("designation", value)
                }
                value={formData.designation}
              >
                <SelectTrigger className="bg-gray-100 border-0 rounded-lg p-4 h-14">
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    zIndex: 50,
                    position: "relative",
                    backgroundColor: "white",
                  }}
                >
                  <SelectItem value="Software Engineer">
                    Software Engineer
                  </SelectItem>
                  <SelectItem value="Research Scientist">
                    Research Scientist
                  </SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Industry Professional">
                    Industry Professional
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                aria-label="Field experience"
                placeholder="Field Experience"
                value={formData.fieldExperience}
                onChange={(e) =>
                  handleInputChange("fieldExperience", e.target.value)
                }
                className="bg-gray-100 border-0 rounded-lg p-4 h-14"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Article Content</h3>
              <p className="text-gray-600">
                Add your article content, title, category, and abstract
              </p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Article Title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="bg-gray-100 border-0 rounded-lg p-4 h-14"
              />

              <Select
                onValueChange={(value) => handleInputChange("category", value)}
                value={formData.category}
              >
                <SelectTrigger className="bg-gray-100 border-0 rounded-lg p-4 h-14">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent
                  style={{
                    zIndex: 50,
                    position: "relative",
                    backgroundColor: "white",
                  }}
                >
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Innovation">Innovation</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Career">Career</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <div className="bg-gray-100 rounded-lg p-4 min-h-[300px]">
                <RichTextEditorNew
                  value={formData.content}
                  onChange={(val) => handleInputChange("content", val)}
                />
              </div>
              <textarea
                placeholder="Add references (one per line)"
                value={formData.references?.join("\n") || ""}
                onChange={(e) =>
                  handleInputChange(
                    "references",
                    e.target.value.split("\n").filter((ref) => ref.trim()),
                  )
                }
                className="w-full bg-gray-100 border-0 rounded-lg p-4 h-32 resize-none"
              />
              <p className="text-red-600 text-sm">
                *Do not upload any copyrighted images, as they will be taken
                down due to legal repercussions.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold mb-2">Upload Cover Image</h3>
              <p className="text-gray-600">
                Choose an eye-catching cover photo for your article.
              </p>
            </div>

            <div className="space-y-6">
              <label
                htmlFor="cover-upload"
                className="block border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg p-10 text-center bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="mb-4 pointer-events-none">
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-700 font-medium text-lg mb-1">
                    {formData.coverPhoto
                      ? formData.coverPhoto.name
                      : "Click or drag image to upload"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cover-upload"
                />
              </label>

              {formData.coverPhoto && (
                <div className="text-center">
                  <img
                    src={URL.createObjectURL(formData.coverPhoto)}
                    alt="Cover Preview"
                    className="w-full h-64 object-cover rounded-lg shadow-sm"
                  />
                  <Button
                    variant="outline"
                    className="mt-4 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={(e) => {
                      e.preventDefault();
                      handleInputChange("coverPhoto", null);
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">
                    Copyright Notice
                  </p>
                  <p className="text-yellow-700">
                    Do not upload any copyrighted images, as they will be taken
                    down due to legal repercussions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3 mt-6">
              <span className="text-2xl">ℹ️</span>
              <p className="text-sm text-blue-800">
                Your article will be reviewed and published within 48 hours
                after submission.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Article Submitted Successfully!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Your article has been submitted for review. Our team will review
              it and publish within 48 hours.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => (window.location.href = "/blogs")}
            >
              View My Articles
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div
        className="relative overflow-hidden min-h-screen"
        style={{ height: "100%", minHeight: "100%" }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none z-0"
          style={{
            minHeight: "100vh",
            backgroundImage: `
              linear-gradient(rgba(107,114,128,0.5) 2px, transparent 2px),
              linear-gradient(90deg, rgba(107,114,128,0.5) 2px, transparent 2px)
            `,
            backgroundSize: "100px 100px",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, transparent 35%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 35%, transparent 100%)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />

        {/* Content above grid */}
        <div className="relative z-10">
          <Header />

          {/* Navigation Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-[#0389FF] text-white border-[#0389FF] rounded-full px-4 hover:bg-[#0389FF]/90"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-[#0389FF] text-white border-[#0389FF] rounded-full px-4 hover:bg-[#0389FF]/90"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>

          <div className="text-center mb-12">
            <p className="text-gray-600 mb-2">Scientific communication</p>
            <h1 className="text-4xl md:text-5xl font-bold">
              Create your <span className="text-yellow-400">Article!</span>
            </h1>

            {/* Publishing requires an account. Saying so here avoids letting
                someone complete every step only to be refused at the end. */}
            {!user && (
              <p
                role="status"
                className="mx-auto mt-4 max-w-xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
              >
                You will need to{" "}
                <Link
                  to="/login?returnTo=%2Fblog-article"
                  className="font-semibold underline"
                >
                  sign in
                </Link>{" "}
                before you can publish this article.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      step.active
                        ? "bg-blue-600 text-white"
                        : currentStep > step.number
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                    }
                  `}
                  >
                    {currentStep > step.number ? "✓" : step.number}
                  </div>
                  {step.active && (
                    <span className="ml-3 text-sm font-medium text-blue-600">
                      {step.title}
                    </span>
                  )}
                  {index < steps.length - 1 && (
                    <div className="w-16 h-px bg-gray-300 ml-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 mb-8">
              {renderStepContent()}
            </div>

            {/* Action Buttons - Updated layout with Back and Continue buttons */}
            <div className="flex justify-between items-center">
              {/* Back Button - Only show from step 2 onwards */}
              {currentStep > 1 && currentStep < 4 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="px-8 py-3 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isPending}
                >
                  BACK
                </Button>
              )}

              {/* Empty div to maintain space when back button is not shown */}
              {(currentStep === 1 || currentStep === 4) && <div></div>}

              {/* Continue/Publish Button */}
              {currentStep === 3 ? (
                <Button
                  onClick={handleContinue}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-semibold"
                  disabled={isPending}
                >
                  {isPending ? "PUBLISHING..." : "PUBLISH"}
                </Button>
              ) : currentStep < 4 ? (
                <Button
                  onClick={handleContinue}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg text-white font-semibold"
                >
                  CONTINUE
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-900 font-bold text-lg">
                <img
                  src="/lovable-uploads/FooterLogo.png"
                  alt="STEM for Society Logo"
                  className="w-full h-full object-contain"
                />
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold">STEM FOR SOCIETY</h4>
              <p className="text-blue-200 text-sm">
                Let's innovate, incubate and impact the world together!
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const BlogCreateNew = () => {
  return (
    <BlogStepperProvider>
      <BlogCreateContent />
    </BlogStepperProvider>
  );
};

export default BlogCreateNew;
