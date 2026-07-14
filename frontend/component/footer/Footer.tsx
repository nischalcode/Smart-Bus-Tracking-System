import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Logo and About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Image
                  src="/Logo.png"
                  alt="Smart Bus Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Smart <span className="text-primary">Bus</span>
              </h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Revolutionizing public transportation with real-time tracking, smart schedules, and accurate arrival predictions.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-colors">
                <FaFacebook size={16} />
              </a>
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-colors">
                <FaTwitter size={16} />
              </a>
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-colors">
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/track-bus" className="text-sm text-gray-500 hover:text-primary transition-colors">Track Bus</Link></li>
              <li><Link href="/routes" className="text-sm text-gray-500 hover:text-primary transition-colors">Routes & Maps</Link></li>
              <li><Link href="/schedule" className="text-sm text-gray-500 hover:text-primary transition-colors">Schedules</Link></li>
              <li><Link href="/about" className="text-sm text-gray-500 hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-gray-500">Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-gray-500">+977 1234567890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-gray-500">support@smartbus.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Newsletter</h3>
            <p className="text-sm text-gray-500 mb-4">Subscribe to get the latest updates and news.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button 
                type="button" 
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} Smart <span className="text-primary font-semibold">Bus</span> Tracking System. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 font-medium">
            Created By <span className="text-gray-900 font-bold">Team Blaze</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;