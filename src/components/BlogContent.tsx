import { sanitizeHtml } from "@/lib/sanitizeHtml";
import React from "react";

interface BlogContentProps {
  markdownContent: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ markdownContent }) => {
  return (
    <div
      className="ql-editor ql-snow"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownContent) }}
    ></div>
  );
};

export default BlogContent;
