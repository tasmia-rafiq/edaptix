"use client";
import { Trash } from "lucide-react";

const DeleteBtn = ({ testId }: { testId: String }) => {
  return (
    <form
      action={`/api/tests/${testId}/delete`}
      method="POST"
      onSubmit={(e) => {
        !confirm(
          "Are you sure you want to permanently delete this test and all submissions? This action cannot be undone."
        ) && e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="text-xs px-3 py-1.5 rounded-md border border-transparent bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-2"
        title="Delete test"
      >
        <Trash size={14} />
      </button>
    </form>
  );
};

export default DeleteBtn;
