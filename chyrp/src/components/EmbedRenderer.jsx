import React, { useState } from "react";

export default function EmbedRenderer({ onEmbed }) {
  const [url, setUrl] = useState("");
  const [embed, setEmbed] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmbed = async () => {
    setMessage("");
    if (!url.trim()) {
      setMessage("❌ Please enter a URL.");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (data.html) {
        if (onEmbed) {
          onEmbed(data.html);
          setMessage("✅ Embed code added to your post!");
          setUrl(""); // Clear input on success
        } else {
          // Fallback for standalone usage
          setEmbed(data.html);
        }
      } else {
        const errorMessage = data.error || "Unsupported or invalid URL";
        setMessage(`❌ ${errorMessage}`);
        setEmbed("");
      }
    } catch (err) {
      console.error("Embed fetch failed", err);
      setMessage("⚠️ Error fetching embed. Check console for details.");
      setEmbed("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        className="border rounded p-2 w-full bg-white dark:bg-gray-900 dark:border-gray-600"
        placeholder="Paste YouTube/Vimeo/Tweet URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={fetchEmbed}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate & Add Embed"}
      </button>

      {message && <p className="text-sm pt-2">{message}</p>}

      {embed && !onEmbed && (
        <div className="mt-4" dangerouslySetInnerHTML={{ __html: embed }} />
      )}
    </div>
  );
}
