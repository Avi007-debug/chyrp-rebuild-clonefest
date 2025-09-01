import React from "react";

export default function PostCard({ post }) {
  return (
    <div className="p-4 bg-white shadow rounded-lg border">
      <h2 className="text-xl font-semibold">{post.title}</h2>
      <p className="mt-2 text-gray-600">{post.content}</p>
    </div>
  );
}
