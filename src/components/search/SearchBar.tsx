import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import useDebounce from "../../hooks/useDebounce";
import images from "../../constants/images";
export default function SearchBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value);
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value) navigate(`/search/${value.trim()}`);
  };

  useEffect(() => {
    if (debouncedValue) navigate(`/search/${debouncedValue}`);
    if (pathname.startsWith("/search") && !debouncedValue) navigate("/");
  }, [debouncedValue]);

  useEffect(() => {
    if (!pathname.startsWith("/search")) setValue("");
  }, [pathname]);

  return (
    <form onSubmit={handleSubmit} className="relative mb-[30px]">
      <label htmlFor="search" className="absolute top-[15px] left-[15px]">
        <img src={images.Search} alt="search icon" />
      </label>
      <input
        id="search"
        className="w-full border rounded-[8px] border-main pr-[8px] pl-[30px] py-[8px] placeholder:text-sm focus:outline-none placeholder:text-gray dark:placeholder:text-whiteDark bg-white dark:bg-black dark:text-white"
        placeholder="포스트를 검색해 보세요"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}