import { Cormorant_Garamond } from "next/font/google";
import { LoginForm } from "../../../features/auth/LoginForm";

const displayFont = Cormorant_Garamond({
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  subsets: ["latin"],
  weight: "600"
});

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[46%] w-full bg-gradient-to-br from-emerald-200/80 via-moss/10 to-transparent lg:h-full lg:w-[68%]"
      />

      <div className="relative mx-auto grid min-h-screen max-w-[96rem] grid-rows-[auto_1fr] gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] lg:grid-rows-1 lg:items-center lg:gap-16 lg:px-16 xl:px-24">
        <section
          aria-labelledby="product-wordmark"
          className="flex min-h-48 items-end py-4 lg:min-h-0 lg:items-center lg:py-0"
        >
          <h1
            id="product-wordmark"
            aria-label="Risk Calculator"
            className={`${displayFont.className} text-[3.25rem] font-semibold leading-[0.86] tracking-[-0.035em] text-stone-950 sm:text-6xl lg:text-8xl xl:text-[6.5rem]`}
          >
            <span className="block">Risk</span>
            <span className="block">Calculator</span>
          </h1>
        </section>

        <section
          aria-label="Acesso à plataforma"
          className="flex w-full items-start justify-center pb-6 lg:items-center lg:justify-end lg:pb-0"
        >
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
