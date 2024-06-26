"use client";

import { getBlogsByUserId, insertBlog } from "@/utils/sql/sql";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoMdArrowBack } from "react-icons/io";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/store/user";

const Myblogs = () => {
  const supabase = createClient();
  const router = useRouter();
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [myblogs, setMyBlogs] = useState<any[]>([]);
  const user = useUser((state) => state?.user);
  const setUser = useUser((state) => state?.setUser);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUserData(data?.user);
        setUser(data?.user);
        getMyBlogs();
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const getMyBlogs = async () => {
    try {
      if (user?.id) {
        const blogs = await getBlogsByUserId(user.id);
        console.log("Blogs retrieved successfully by user ID:", blogs);
        if (blogs !== undefined) {
          setMyBlogs(blogs || []);
        }
      }
    } catch (error) {
      console.error("Error retrieving blogs by user ID:", error);
      setMyBlogs([]);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    setFile(uploadedFile || null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!file) {
        throw new Error("Please select a file.");
      }

      const { data: fileData, error: fileError } = await supabase.storage
        .from("images")
        .upload(`files/${file.name}`, file);

      if (fileError) {
        throw fileError;
      }

      await insertBlog(title, description, fileData?.path, userData?.id);

      const { data: insertData, error: insertError } = await supabase
        .from("blogs")
        .insert([{ title, description, file_url: fileData?.path }]);

      if (insertError) {
        throw insertError;
      }

      setTitle("");
      setDescription("");
      setFile(null);

      console.log("Form submitted successfully:", insertData);
      // Refresh blogs after successful submission
      getMyBlogs();
    } catch (error: any) {
      console.error("Error submitting form:", error.message);
    }
  };

  return (
    <div className="pl-10 pr-10 pt-10">
      <Button
        variant="outline"
        className="cursor-pointer flex gap-2"
        onClick={() => router.back()}
      >
        <IoMdArrowBack /> Myblogs
      </Button>

      <div className="pb-4 pt-4">
        <form onSubmit={handleSubmit}>
          <div className="pb-4">
            <Label htmlFor="title">Title :</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              maxLength={50}
              required
            />
          </div>
          <div className="pb-4">
            <Label htmlFor="description">Description (up to 1000 words):</Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              rows={5}
              maxLength={1000}
              required
            />
          </div>
          <div className="pb-4">
            <Label htmlFor="file">Upload File:</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg"
              required
            />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </div>

      <div>
        {myblogs.map((blog) => (
          <div key={blog.id}>
            <h3>{blog.title}</h3>
            <p>{blog.description}</p>
            <img src={blog.file_url} alt="Blog Image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Myblogs;
