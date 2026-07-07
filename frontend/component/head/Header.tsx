
import Image from "next/image";
import Link from "next/link";

const Header = () => {

  return (
    // <section className="mx-auto max-w-7xl">
    <header className=" sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">

    <div className=" flex items-center gap-3">
  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
    <Image
      src="/Logo.png"
      alt="Smart Bus Logo"
      width={24}
      height={24}
      className="h-6 w-6"
      priority
    />
  </div>

 
  <div className="flex flex-col">
    <h1 className="text-xl font-bold leading-tight">
      <span>Smart </span>
      <span className="text-primary">Bus</span>
    </h1>

    <p className="text-xs text-gray-500">
      Tracking System
    </p>
  </div>
</div>

   
    <nav className="hidden items-center gap-8 lg:flex">
      <Link
        href="/"
        className="border-brand text-brand border-b-2 pb-1 font-medium"
      >
        Home
      </Link>

      <Link
        href="/track-bus"
        className="text-text-muted hover:text-text-main font-medium"
      >
        Track Bus
      </Link>

      <Link
        href="/routes"
        className="text-text-muted hover:text-text-main font-medium"
      >
        Routes
      </Link>

      <Link
        href="/schedule"
        className="text-text-muted hover:text-text-main font-medium"
      >
        Schedule
      </Link>

      <Link
        href="/notifications"
        className="text-text-muted hover:text-text-main font-medium"
      >
        Notifications
      </Link>

      <Link
        href="/about"
        className="text-text-muted hover:text-text-main font-medium"
      >
        About Us
      </Link>
    </nav>

    
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-text-main hover:bg-gray-50 rounded-lg border border-gray-400 px-5 py-2 text-sm font-medium"
      >
        Login
      </Link>

      <Link
        href="/register"
        className="bg-primary hover:bg-brand-dark rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors"
      >
        Sign Up
      </Link>
    </div>
  </header>
  )
}

export default Header