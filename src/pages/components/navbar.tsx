import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div>
              <div className="flex items-center py-5 px-2 text-gray-700 hover:text-gray-900">
                <Image
                  src="/dog.svg"
                  alt="DOGimg Logo"
                  className="rounded-full"
                  width={40}
                  height={40}
                />
                <span className="font-bold">DOGimg</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <a href="https://github.com/zeikar/dogimg" target="_blank">
              <Image
                src="/github-mark.svg"
                alt="Github"
                width={40}
                height={40}
              />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
