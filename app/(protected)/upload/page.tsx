import { ProtectedPageWrapper } from "@/components/protected-page-wrapper";
import { Suspense } from "react";
import { BillUploadSkeleton } from "@/components/bill-upload-skeleton";

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProtectedPageWrapper />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-2xl mx-auto py-8 px-4">
      <BillUploadSkeleton />
    </div>
  );
}

