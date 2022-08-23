$TTL		1d	; default ttl
com.               		IN      SOA     dnscom.com.  root.dnscom.com. (
                        			2009129001 ; serial
                        			8h ; refresh
                        			4h ; retry
                        			1000h ; expire
                        			20m ; negative cache ttl
                        			)

com.				IN	NS	dnscom.com.
dnscom.com.			IN	A	11.0.0.10

r2.com.				IN	A	11.0.0.2
r2.com.				IN	A	9.0.0.2
r1.com.				IN	A	11.0.0.1
r1.com.				IN	A	12.0.0.1

emp1.com.       		IN	NS	dnsemp1.emp1.com.
dnsemp1.emp1.com.    		IN	A	12.0.0.10
