export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
    </div>
  );
}
