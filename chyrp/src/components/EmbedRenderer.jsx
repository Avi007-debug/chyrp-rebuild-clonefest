import React, { useState, useEffect } from "react"; // ✅ Fix

export default function EmbedRenderer() {
  const [url, setUrl] = useState("");
  const [embed, setEmbed] = useState("");

  const fetchEmbed = async () => {
    try {
      // Call noembed API directly from frontend
      const res = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (data.html) {
        setEmbed(data.html);
      } else {
        setEmbed("<p>❌ Unsupported or invalid URL</p>");
      }
    } catch (err) {
      console.error("Embed fetch failed", err);
      setEmbed("<p>⚠️ Error fetching embed</p>");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <input
        type="text"
        className="border rounded p-2 w-full"
        placeholder="Paste YouTube/Vimeo/Tweet URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={fetchEmbed}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
      >
        Embed
      </button>

      {embed && (
        <div
          className="mt-4"
          dangerouslySetInnerHTML={{ __html: embed }}
        />
      )}
    </div>
  );
}
