import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { HeroUIProvider } from "@heroui/react";
import { router } from "./routes";

export default function App() {
  return (
    <HeroUIProvider defaultTheme="light">
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </HeroUIProvider>
  );
}
