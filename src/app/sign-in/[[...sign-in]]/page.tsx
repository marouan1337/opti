import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";
import AuthRedirect from "../../../components/AuthRedirect";

export default function SignInPage() {
  return (
    <>
      <AuthRedirect />
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 p-6">
      <div className="w-full max-w-md">
        {/* Left side decorative element */}
        <div className="absolute left-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[url('/images/pattern-dots.png')] bg-repeat"></div>
        </div>
        
        {/* Card */}
        <div className="relative backdrop-blur-sm bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          {/* Top decorative accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
          
          {/* Logo and header */}
          <div className="pt-8 pb-2 px-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">OptiCore</h1>
            <p className="mt-2 text-sm text-blue-100">
              Sign in to your account to manage your fleet
            </p>
          </div>
          
          {/* Sign in form */}
          <div className="p-8">
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm normal-case rounded-lg",
                  card: "shadow-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20 normal-case",
                  socialButtonsBlockButtonText: "text-white",
                  socialButtonsBlockButtonIcon: "text-white",
                  formFieldLabel: "text-blue-100",
                  formFieldInput: "bg-white/10 border-white/20 text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-blue-400",
                  footerActionText: "text-blue-100",
                  footerActionLink: "text-blue-300 hover:text-blue-200",
                  identityPreviewText: "text-white",
                  identityPreviewEditButtonText: "text-blue-300"
                },
              }}
              routing="path"
              path="/sign-in"
              redirectUrl="/dashboard"
              signUpUrl="/sign-up"
            />
          </div>
          
          {/* Bottom decorative element */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-500/30 to-transparent rounded-tl-full"></div>
        </div>
        
        {/* Right side decorative element */}
        <div className="absolute right-0 bottom-0 h-full w-1/3 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[url('/images/pattern-dots.png')] bg-repeat"></div>
        </div>
      </div>
    </div>
    </>
  );
}