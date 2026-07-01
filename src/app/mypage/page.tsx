import { Suspense } from "react";
import MyPageContent from "./content";

export default function MyPagePage() {
  return (
    <Suspense>
      <MyPageContent />
    </Suspense>
  );
}
