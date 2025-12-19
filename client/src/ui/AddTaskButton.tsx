import "../App.css";

type AddTaskButtonProps = {
  add: () => void;
  recording: boolean;
  disabled?: boolean;
};

export default function AddTaskButton({ add, recording, disabled }: Readonly<AddTaskButtonProps>) {
  return (
    <button
      type="button"
      onClick={add}
      disabled={disabled}
      className="inline-flex items-center my-auto
      justify-center w-10 h-10 text-indigo-100 transition-transform
      duration-150 bg-blue-600/90 rounded-full border-1 border-slate-500/40 active:scale-95
      focus:shadow-outline shrink-0 aspect-square disabled:opacity-50 hover:bg-blue-500/90"
    >
      <svg className="w-7 h-7 fill-current" viewBox="0 0 20 20">
        <path
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clipRule="evenodd"
          fillRule="evenodd"
        />
      </svg>
    </button>
  );
}

