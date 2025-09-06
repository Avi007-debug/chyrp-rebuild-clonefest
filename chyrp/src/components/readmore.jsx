import React, { useState } from "react";

const ReadMore = ({ text, maxLength = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p>{text}</p>;
  }

  return (
    <p>
      {isExpanded ? text : text.substring(0, maxLength) + "... "}
      <span
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-500 cursor-pointer"
      >
        {isExpanded ? "Show Less" : "Read More"}
      </span>
    </p>
  );
};

export default ReadMore;