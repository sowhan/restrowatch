import ReviewCard from './ReviewCard'

export default function LiveFeed({ reviews, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-32 mb-3" />
            <div className="h-3 bg-border rounded w-full mb-2" />
            <div className="h-3 bg-border rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-gray-400 text-lg">No reviews yet</p>
        <p className="text-gray-500 text-sm mt-1">Reviews will appear here as they come in from Swiggy and Zomato</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
