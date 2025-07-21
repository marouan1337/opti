import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  
  // If the user is signed in, redirect to the dashboard
  if (userId) {
    redirect("/dashboard");
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 bg-gray-50">
      <main className="max-w-4xl w-full text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Fleet & Transport Management App</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Efficiently manage your fleet of vehicles, drivers, routes, and rentals with our comprehensive management solution.
        </p>
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Vehicle Management</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Driver Assignment</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Trip & Route Planning</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Maintenance Tracking</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 items-center justify-center">          
          <Link
            href="/sign-in"
            className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Sign Up
          </Link>
          </div>
      </main>
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Fleet & Transport Management App. All rights reserved.</p>
        </footer>
      </div>
    );
  }
