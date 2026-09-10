import type { Metadata } from "next";

import "./globals.css";
import {Playfair_Display} from 'next/font/google'

const playfair=Playfair_Display({
    subsets:["latin"],
    weight:["400","500","600","700"],
    variable:"--font-poppins"
})


export const metadata: Metadata = {
  title: "Hotel Management System New - Pet Pooja",
  description: "Hotel Management System New - Pet Pooja",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en"
      className={playfair.variable}>
      <body>
      {children}
      </body>
    </html>
  );
}
