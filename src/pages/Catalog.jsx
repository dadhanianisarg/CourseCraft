import React, { useEffect, useState } from 'react'
import Footer from '../components/common/Footer'
import { useParams } from 'react-router-dom'
import { apiConnector } from '../services/apiconnector';
import { categories } from '../services/apis';
import { getCatalogaPageData } from '../services/operations/pageAndComponentData';
import { semanticSearchCourses } from '../services/operations/courseDetailsAPI';
import CourseCard from '../components/core/Catalog/CourseCard';
import CourseSlider from '../components/core/Catalog/CourseSlider';
import { useSelector } from "react-redux"
import Error from "./Error"

const Catalog = () => {

    const { loading } = useSelector((state) => state.profile)
  const { catalogName } = useParams()
  const [active, setActive] = useState(1)
    const [catalogPageData, setCatalogPageData] = useState(null);
    const [categoryId, setCategoryId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchFallback, setSearchFallback] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    //Fetch all categories
    useEffect(()=> {
        const getCategories = async() => {
            const res = await apiConnector("GET", categories.CATEGORIES_API);
            const category_id = 
            res?.data?.data?.filter((ct) => ct.name.split(" ").join("-").toLowerCase() === catalogName)[0]?._id;
            setCategoryId(category_id);
        }
        getCategories();
    },[catalogName]);

    useEffect(() => {
        const getCategoryDetails = async() => {
            try{
                const res = await getCatalogaPageData(categoryId);
                console.log("PRinting res: ", res);
                setCatalogPageData(res);
            }
            catch(error) {
                console.log(error)
            }
        }
        if(categoryId) {
            getCategoryDetails();
        }
        
    },[categoryId]);

    useEffect(() => {
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery.length < 3) {
            setSearchResults([]);
            setSearchFallback(false);
            setSearchLoading(false);
            return undefined;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const response = await semanticSearchCourses(trimmedQuery, controller.signal);
                if (!controller.signal.aborted) {
                    setSearchResults(response.data || []);
                    setSearchFallback(response.fallback === true);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setSearchResults([]);
                    setSearchFallback(false);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSearchLoading(false);
                }
            }
        }, 400);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery]);


    if (loading || !catalogPageData) {
        return (
          <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
            <div className="spinner"></div>
          </div>
        )
      }
      if (!loading && !catalogPageData.success) {
        return <Error />
      }
    
      return (
        <>
          {/* Hero Section */}
          <div className=" box-content bg-richblack-800 px-4">
            <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent ">
              <p className="text-sm text-richblack-300">
                {`Home / Catalog / `}
                <span className="text-yellow-25">
                  {catalogPageData?.data?.selectedCategory?.name}
                </span>
              </p>
              <p className="text-3xl text-richblack-5">
                {catalogPageData?.data?.selectedCategory?.name}
              </p>
              <p className="max-w-[870px] text-richblack-200">
                {catalogPageData?.data?.selectedCategory?.description}
              </p>
            </div>
          </div>
    
          {/* Section 1 */}
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="mb-10">
              <div className="mb-3 flex items-center gap-2">
                <label htmlFor="course-search" className="text-xl text-richblack-5">
                  Find a course
                </label>
                <span className="rounded-full bg-richblack-700 px-2 py-1 text-xs text-yellow-25">
                  {searchFallback ? "Showing keyword results" : "AI search"}
                </span>
              </div>
              <input
                id="course-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses by topic or skill"
                className="w-full rounded-lg border border-richblack-600 bg-richblack-700 px-4 py-3 text-richblack-5 outline-none placeholder:text-richblack-400 focus:border-yellow-25"
              />
              {searchQuery.trim().length >= 3 && (
                <div className="mt-6">
                  {searchLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="spinner"></div>
                    </div>
                  ) : searchResults.length ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {searchResults.map(({ course }) => (
                        <CourseCard course={course} key={course._id} Height={"h-[250px]"} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-richblack-200">No close matches. Try different words.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {searchQuery.trim().length < 3 && (
            <>
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="section_heading">Courses to get you started</div>
            <div className="my-4 flex border-b border-b-richblack-600 text-sm">
              <p
                className={`px-4 py-2 ${
                  active === 1
                    ? "border-b border-b-yellow-25 text-yellow-25"
                    : "text-richblack-50"
                } cursor-pointer`}
                onClick={() => setActive(1)}
              >
                Most Populer
              </p>
              <p
                className={`px-4 py-2 ${
                  active === 2
                    ? "border-b border-b-yellow-25 text-yellow-25"
                    : "text-richblack-50"
                } cursor-pointer`}
                onClick={() => setActive(2)}
              >
                New
              </p>
            </div>
            <div>
              <CourseSlider
                Courses={catalogPageData?.data?.selectedCategory?.courses}
              />
            </div>
          </div>
          {/* Section 2 */}
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="section_heading">
              Top courses in {catalogPageData?.data?.differentCategory?.name}
            </div>
            <div className="py-8">
              <CourseSlider
                Courses={catalogPageData?.data?.differentCategory?.courses}
              />
            </div>
          </div>
    
          {/* Section 3 */}
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="section_heading">Frequently Bought</div>
            <div className="py-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {catalogPageData?.data?.mostSellingCourses
                  ?.slice(0, 4)
                  .map((course, i) => (
                    <CourseCard course={course} key={i} Height={"h-[400px]"} />
                  ))}
              </div>
            </div>
          </div>
          </>
          )}
          <Footer />
        </>
      )
    }
    
    export default Catalog