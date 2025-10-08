"use client";

const DeleteBtn = ({ action, onSubmitMsg, btn } : { action: any; onSubmitMsg: any; btn: any }) => {
  return (
    <form
      action={action}
      method="POST"
      onSubmit={(e) => {
        !confirm(
          onSubmitMsg
        ) && e.preventDefault();
      }}
    >
      {btn}
    </form>
  );
};

export default DeleteBtn;
