export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card">
      <p>{message || 'Something went wrong.'}</p>
      {onRetry ? (
        <button className="btn btn-primary" onClick={onRetry} type="button">
          Retry
        </button>
      ) : null}
    </div>
  );
}
