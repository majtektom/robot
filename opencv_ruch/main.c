// compiled with: g++ circles.cpp -o circles `pkg-config --cflags --libs opencv`
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/types.h>
#include <dirent.h>//operacje na plikach
#include <sys/inotify.h>//operacje na plikach
#include <sys/stat.h>
#include <unistd.h>
#include <cv.h>
#include <highgui.h>
#include <math.h>

#include <signal.h>
#include <limits.h>
#include <fcntl.h>
#include <iostream>
#include <string>
#include <map>
#include <unistd.h>


using std::map;
using std::string;
using std::cout;
using std::endl;

#define EVENT_SIZE          ( sizeof (struct inotify_event) )
#define EVENT_BUF_LEN       ( 1024 * ( EVENT_SIZE + NAME_MAX + 1) )
#define WATCH_FLAGS         ( IN_CREATE | IN_DELETE )

IplImage* img = NULL;
IplImage* img_old = NULL;

// Keep going  while run == true, or, in other words, until user hits ctrl-c
static bool run = true;

void sig_callback( int sig )
{
    run = false;
}

// Watch class keeps track of watch descriptors (wd), parent watch descriptors (pd), and names (from event->name).
// The class provides some helpers for inotify, primarily to enable recursive monitoring:
// 1. To add a watch (inotify_add_watch), a complete path is needed, but events only provide file/dir name with no path.
// 2. Delete events provide parent watch descriptor and file/dir name, but removing the watch (infotify_rm_watch) needs a wd.
//
class Watch {
    struct wd_elem {
        int pd;
        string name;
        bool operator() (const wd_elem &l, const wd_elem &r) const
            { return l.pd < r.pd ? true : l.pd == r.pd && l.name < r.name ? true : false; }
    };
    map<int, wd_elem> watch;
    map<wd_elem, int, wd_elem> rwatch;
public:
    // Insert event information, used to create new watch, into Watch object.
    void insert( int pd, const string &name, int wd ) {
        wd_elem elem = {pd, name};
        watch[wd] = elem;
        rwatch[elem] = wd;
    }
    // Erase watch specified by pd (parent watch descriptor) and name from watch list.
    // Returns full name (for display etc), and wd, which is required for inotify_rm_watch.
    string erase( int pd, const string &name, int *wd ) {
        wd_elem pelem = {pd, name};
        *wd = rwatch[pelem];
        rwatch.erase(pelem);
        const wd_elem &elem = watch[*wd];
        string dir = elem.name;
        watch.erase(*wd);
        return dir;
    }
    // Given a watch descriptor, return the full directory name as string. Recurses up parent WDs to assemble name, 
    // an idea borrowed from Windows change journals.
    string get( int wd ) {
        const wd_elem &elem = watch[wd];
        return elem.pd == -1 ? elem.name : this->get(elem.pd) + "/" + elem.name;
    }
    // Given a parent wd and name (provided in IN_DELETE events), return the watch descriptor.
    // Main purpose is to help remove directories from watch list.
    int get( int pd, string name ) {
        wd_elem elem = {pd, name};
        return rwatch[elem];
    }
    void cleanup( int fd ) {
        for (map<int, wd_elem>::iterator wi = watch.begin(); wi != watch.end(); wi++) {
            inotify_rm_watch( fd, wi->first );
            watch.erase(wi);
        }
        rwatch.clear();
    }
    void stats() {
        cout << "number of watches=" << watch.size() << " & reverse watches=" << rwatch.size() << endl;
    }
};
//---------------------------------------------------------
void Wykrywaj(const char* filename){
	string s=filename;
	string st="/tmp/"+s;
	bool wykryto=0;
	CvMemStorage* storage = NULL;
	if ((img = cvLoadImage(st.c_str()))== 0)
    {
        printf("cvLoadImage failed\n");
    }
		int w=img->width;
		int h=img->height;  

			
		//----------------------------------------
		//kk = new cv.Matrix(w, h); 
		//kk=im.copy();
		if(img_old!=NULL){
			CvRect rect;
			CvSeq* contours = 0;
			//create storage for contours
			storage = cvCreateMemStorage(0);
			//CvMat *diff = cvCreateMat(w,h,CV_8UC4);
			CvSize imgSize;
		   imgSize.width = img->width;
		   imgSize.height = img->height;
			IplImage* diff = cvCloneImage(img);
			IplImage* ccc =  cvCloneImage(img);//cvCreateImage( imgSize, IPL_DEPTH_8U, 3); 
			//bluring the differnece image
            cvSmooth(img, img, CV_BLUR); 
			cvAbsDiff(img, img_old, diff);  // diff = img  - img_old

			//bluring the differnece image
            cvSmooth(diff, diff, CV_BLUR);             

            //apply threshold to discard small unwanted movements
            cvThreshold(diff, diff, 25, 255, CV_THRESH_BINARY);
			
			IplImage* diff1 = cvCreateImage( imgSize, IPL_DEPTH_8U, 1); //cvCloneImage(img);
			cvCvtColor(diff,diff1,CV_RGB2GRAY);
             //find contours
             cvFindContours( diff1, storage, &contours );//, CV_RETR_LIST, CV_CHAIN_APPROX_NONE );

              //draw bounding box around each contour
              for(; contours!=0; contours = contours->h_next)
              {
                     rect = cvBoundingRect(contours, 0); //extract bounding box for current contour
					 //contours->area();
					 //wielkosc minimalnego pola wyktywanego
					 if((rect.width*rect.height) >240){
						 printf("wielkosc %d x %d\n",rect.width,rect.height);
						 //drawing rectangle
						 cvRectangle(ccc,                  
									  cvPoint(rect.x, rect.y),    
									  cvPoint(rect.x+rect.width, rect.y+rect.height),
									  cvScalar(0, 0, 255, 0),
									  2, 8, 0);    
						wykryto=1;
					 }else{
						 cvRectangle(ccc,                  
									  cvPoint(rect.x, rect.y),    
									  cvPoint(rect.x+rect.width, rect.y+rect.height),
									  cvScalar(0,255 ,0 , 0),
									  1, 8, 0);  
						 
					 }									  
              }
		//cvAdd(img, ccc, diff, NULL); 
        //clear memory and contours
        cvClearMemStorage( storage );
        contours = 0;
		string out="/tmp/out/"+s;
        cvSaveImage(out.c_str(), ccc);
		if(wykryto==1){
			string out1="/home/pi/robot/nodeweb/fotki/"+s;
			cvSaveImage(out1.c_str(), ccc);
		}
		cvReleaseImage( &diff1 );
		cvReleaseImage( &diff );
		cvReleaseImage( &ccc );
		}
	
	
    // IplImage* gray = cvCreateImage(cvGetSize(img), IPL_DEPTH_8U, 1);
    // CvMemStorage* storage = cvCreateMemStorage(0);

    // cvCvtColor(img, gray, CV_BGR2GRAY);

 //   This is done so as to prevent a lot of false circles from being detected
    // cvSmooth(gray, gray, CV_GAUSSIAN, 7, 7);

    // IplImage* canny = cvCreateImage(cvGetSize(img),IPL_DEPTH_8U,1);
    // IplImage* rgbcanny = cvCreateImage(cvGetSize(img),IPL_DEPTH_8U,3);
    // cvCanny(gray, canny, 50, 100, 3);

    // CvSeq* circles = cvHoughCircles(gray, storage, CV_HOUGH_GRADIENT, 1, gray->height/3, 250, 100);
    // cvCvtColor(canny, rgbcanny, CV_GRAY2BGR);

    // for (size_t i = 0; i < circles->total; i++)
    // {
      ////   round the floats to an int
         // float* p = (float*)cvGetSeqElem(circles, i);
         // cv::Point center(cvRound(p[0]), cvRound(p[1]));
         // int radius = cvRound(p[2]);

      ////   draw the circle center
         // cvCircle(rgbcanny, center, 3, CV_RGB(0,255,0), -1, 8, 0 );

      ////   draw the circle outline
         // cvCircle(rgbcanny, center, radius+1, CV_RGB(0,0,255), 2, 8, 0 );

         // printf("x: %d y: %d r: %d\n",center.x,center.y, radius);
    // }

    // string out="/tmp/out/"+s;
    // cvSaveImage(out.c_str(), rgbcanny);
	
	cvReleaseImage( &img_old );
	img_old=img;
	//cvReleaseImage( &canny );
	//cvReleaseImage( &rgbcanny );
	//cvReleaseImage( &gray );
	//cvReleaseMat( &diff ); //macierzy
	//cvClearMemStorage(storage);
	//cvReleaseMemStorage(&storage);
	//cvReleaseImage( &img );
	
}
//---------------------------------------
int main( )
{	

    // std::map used to keep track of wd (watch descriptors) and directory names
    // As directory creation events arrive, they are added to the Watch map.
    // Directory delete events should be (but currently aren't in this sample) handled the same way.
    Watch watch;

    // watch_set is used by select to wait until inotify returns some data to 
    // be read using non-blocking read.
    fd_set watch_set;

    char buffer[ EVENT_BUF_LEN ];
    string current_dir, new_dir;
    int total_file_events = 0;
    int total_dir_events = 0;

    // Call sig_callback if user hits ctrl-c
    signal( SIGINT, sig_callback );

    // creating the INOTIFY instance
// inotify_init1 not available with older kernels, consequently inotify reads block.
// inotify_init1 allows directory events to complete immediately, avoiding buffering delays. In practice,
// this significantly improves monotiring of newly created subdirectories.
#ifdef IN_NONBLOCK
    int fd = inotify_init1( IN_NONBLOCK );
#else
    int fd = inotify_init();
#endif

    // checking for error
    if ( fd < 0 ) {
        perror( "inotify_init" );
    }
	//-----------
	DIR* dir = opendir("/tmp/out/");
	if(dir==NULL){
		printf( "tworze katalog out\n"); 
		mkdir("/tmp/out/", 0777);
		usleep(1000);
	}else{
		struct dirent * plik;
		while(( plik = readdir( dir ) ) ){
			string file= plik->d_name ;
			string path="/tmp/out/";
			string dd=path+"/"+file;
			if( remove( dd.c_str() ) == 0 ) ;//printf( " usunieto plik %s\n",dd.c_str());
		}
		
	}


    

   
        

	closedir( dir );
	string lista[3];
	int li=0;
	//-----------------
    // use select watch list for non-blocking inotify read
    FD_ZERO( &watch_set );
    FD_SET( fd, &watch_set );

    const char *root = "/tmp";
	const char *root1 = "/tmp/out";
    int wd = inotify_add_watch( fd, root, IN_MODIFY  );//IN_CREATE
    int wd1 = inotify_add_watch( fd, root1, IN_CREATE  );//IN_MODIFY
    // add wd and directory name to Watch map
    watch.insert( -1, root, wd );
	watch.insert( -1, root1, wd1 );

    // Continue until run == false. See signal and sig_callback above.
    while ( run ) {
        // select waits until inotify has 1 or more events.
        // select syntax is beyond the scope of this sample but, don't worry, the fd+1 is correct:
        // select needs the the highest fd (+1) as the first parameter.
        select( fd+1, &watch_set, NULL, NULL, NULL );

        // Read event(s) from non-blocking inotify fd (non-blocking specified in inotify_init1 above).
        int length = read( fd, buffer, EVENT_BUF_LEN ); 
        if ( length < 0 ) {
            perror( "read" );
        }  

        // Loop through event buffer
        for ( int i=0; i<length; ) {
            struct inotify_event *event = ( struct inotify_event * ) &buffer[ i ];
            // Never actually seen this
            if ( event->wd == -1 ) {
   	        printf( "Overflow\n" );
			}
            if ( event->len ) {
				if ( event->mask & IN_CREATE ) {
					
					if(event->wd==2) {
						current_dir = watch.get(event->wd);
						//printf( " %s/%s - %d\n",current_dir.c_str(),event->name,event->wd);
						//dodajemy do listy
						if(lista[li]!=""){
							//printf( "usuwam wpis %s ",lista[li].c_str());
							if( remove( lista[li].c_str() ) == 0 ) ;//printf( " usunieto plik\n");
							
						}
						string fd=event->name;
						lista[li]=current_dir+"/"+fd;
						li++;
						if(li>3)li=0;
					}
				}else if ( event->mask & IN_MODIFY ) {
                    current_dir = watch.get(event->wd);
					if(event->wd==1) {
						if ( event->mask & IN_ISDIR ) {

						} else {
							//printf( "New file %s/%s created.\n", current_dir.c_str(), event->name );
							string file=event->name;
							string delimiter = ".";
							size_t pos = 0;
							string token;
							while ((pos = file.find(delimiter)) != string::npos) {
								token = file.substr(0, pos);
								//cout << token << " nazwa"<<endl;
								file.erase(0, pos + delimiter.length());
							}
							//wykrywamy ruch gdy plik ma rozszerzenie jpg
							if(file==string("jpg")) { 
								//printf( "wykrywam %s/%s\n",current_dir.c_str(),event->name);
								Wykrywaj(event->name);
								}
							
							
						}
					}
					} else if ( event->mask & IN_DELETE ) {
						if ( event->mask & IN_ISDIR ) {

						} else {
							//current_dir = watch.get(event->wd);
							//printf( "File %s/%s deleted.\n", current_dir.c_str(), event->name );
						}
                }
            }
            i += EVENT_SIZE + event->len;
        }
    }

    // Cleanup 
    printf( "cleaning up\n" );
    watch.stats();
    watch.cleanup( fd );
    watch.stats();
    close( fd );
    fflush(stdout); 
}
