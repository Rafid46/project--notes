"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";

const BehanceIcon = ({ size = 20, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 6H11C13.5 6 14.5 7.5 14.5 9.5C14.5 11 13.5 12 11.5 12H7V6Z" />
    <path d="M7 12H11.5C14 12 15.5 13.5 15.5 15.5C15.5 18 14 19 11 19H7V12Z" />
    <line x1="18" y1="9" x2="21" y2="9" />
  </svg>
);

export default function ProfileMenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            layoutId="profile-menu-container"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-10 items-center gap-2 bg-sidebar px-4 rounded-full text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors shadow-xs"
          >
            <motion.span
              layoutId="menu-text-label"
              className="text-sm font-semibold"
            >
              menu
            </motion.span>
            <motion.div
              layoutId="menu-dot-icon"
              className="w-1.5 h-1.5 bg-current rounded-full"
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId="profile-menu-container"
            className="absolute top-0 right-0 w-[380px] h-[calc(100vh-48px)] max-h-[800px] bg-sidebar text-sidebar-foreground rounded-xl shadow-2xl overflow-hidden flex flex-col p-8 z-50 origin-top-right"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground hover:opacity-70 transition-opacity"
              >
                <motion.span layoutId="menu-text-label">close</motion.span>
                <motion.div
                  layoutId="menu-dot-icon"
                  className="bg-sidebar-foreground text-sidebar p-1.5 rounded-full flex items-center justify-center"
                >
                  <X size={14} strokeWidth={2.5} />
                </motion.div>
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-12 flex-1">
              <Link
                href="/works"
                className="text-5xl font-medium tracking-tight text-zinc-900 hover:opacity-60 transition-opacity"
              >
                works
              </Link>
              <Link
                href="/about"
                className="text-5xl font-medium tracking-tight text-zinc-900 hover:opacity-60 transition-opacity"
              >
                about
              </Link>
              <Link
                href="/contact"
                className="text-5xl font-medium tracking-tight text-zinc-900 hover:opacity-60 transition-opacity"
              >
                contact
              </Link>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <a
                href="mailto:pertantpacome@gmail.com"
                className="text-sm text-zinc-900 hover:underline tracking-tight"
              >
                pertantpacome@gmail.com
              </a>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <BehanceIcon size={14} />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
