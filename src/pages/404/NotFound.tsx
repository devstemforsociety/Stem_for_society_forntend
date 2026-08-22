import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import Header from "@/components1/Header";
import Footer from "@/components1/Footer";
import logo from "@/assets/logo.webp";

/**
 * Where a lost visitor most likely meant to go.
 *
 * Deliberately short: a wall of links is its own kind of dead end. These are
 * the four destinations that cover almost every mistyped or stale URL on the
 * site.
 */
const SUGGESTIONS = [
  { to: "/courses", label: "Courses", hint: "Browse every programme on offer" },
  { to: "/training", label: "Trainings", hint: "Live and upcoming sessions" },
  { to: "/blogs", label: "Blog", hint: "Articles from our community" },
  { to: "/insituion-individual", label: "Get started", hint: "Individual and institution plans" },
];

type NotFoundProps = {
  /**
   * "bare" drops the public header and footer.
   *
   * The admin and partner areas have their own chrome and their own sign-in
   * state, so dropping a marketing header into the middle of them would be
   * disorienting rather than helpful.
   */
  variant?: "site" | "bare";
};

export function NotFound({ variant = "site" }: NotFoundProps) {
  const bare = variant === "bare";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!bare && <Header />}

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-2xl text-center">
          {bare && (
            <Link to="/" className="inline-block mb-10">
              <img src={logo} alt="STEM for Society" className="h-12 w-auto mx-auto" />
            </Link>
          )}

          {/* The 404 itself, set in the display face the rest of the site uses
              for headings so this page still reads as part of the product. */}
          <p
            className="font-instrument text-[#0389FF] leading-none select-none
                       text-[6rem] sm:text-[8rem] md:text-[10rem]"
            aria-hidden="true"
          >
            404
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-medium text-gray-900">
            We couldn&apos;t find that page
          </h1>

          <p className="mt-4 text-base text-gray-600 max-w-md mx-auto">
            The link may be out of date, or the address might have a typo in it.
            Nothing is broken on your end.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full
                         bg-[#0389FF] px-6 py-3 text-white font-medium
                         hover:bg-[#0272d6] transition-colors
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0389FF] focus-visible:ring-offset-2"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go to homepage
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 rounded-full
                         border border-gray-300 px-6 py-3 text-gray-700 font-medium
                         hover:bg-gray-50 transition-colors
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </button>
          </div>

          {!bare && (
            <div className="mt-14 text-left">
              <div className="flex items-center gap-2 justify-center mb-5 text-gray-500">
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">Or try one of these</span>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="group block rounded-xl border border-gray-200 p-4
                                 hover:border-[#0389FF] hover:bg-blue-50/40 transition-colors
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0389FF]"
                    >
                      <span className="block font-medium text-gray-900 group-hover:text-[#0389FF]">
                        {item.label}
                      </span>
                      <span className="block text-sm text-gray-500 mt-0.5">
                        {item.hint}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bare && (
            <p className="mt-10 text-sm text-gray-500">
              <Search className="inline h-4 w-4 mr-1 -mt-0.5" aria-hidden="true" />
              If you reached this from a menu link, it may point somewhere that
              no longer exists.
            </p>
          )}
        </div>
      </main>

      {!bare && <Footer />}
    </div>
  );
}

export default NotFound;
