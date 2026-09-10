"use client"

import React, { useEffect, useState } from 'react'

import { AxiosError } from 'axios';
import api from '../../services/api';

function page() {

  const [name,setName]=useState <string> ("")
  const [email,setEmail]=useState <string> ("")
  const [role,setRole]=useState <string> ("")
  const [password,setPassword]=useState <string> ("")
  const [branch,setBranchName]=useState <string> ("")


  async function userRegister(e:React.FormEvent <HTMLFormElement> ) {
    
    e.preventDefault()

    try{
        const res=await api.post('/user/register',{name,email,role,password,branch})
        alert(res.data.message)
    }
    catch(err){
    const error = err as AxiosError<{ message?: string }>;
    alert( error.response?.data?.message || error.message || "Register failed. Please try again." )
    }

  }

  interface branchDatas {
  _id: string,
  branch: string,
  branchCode: string,
  address: string,
  createdBy: string,
  }

  const [branchData,setBranchData]=useState <branchDatas[]> ()

  async function getBranches() {
    try{
        const res=await api.get('/get/branch')
        setBranchData(res.data.data)
    }
    catch(err){

    }
  }

  useEffect(()=>{
    getBranches()
  },[])

  return (
    <>
    
    
    <form action="" onSubmit={(e)=>userRegister(e)}>

    <input type="text" placeholder='name' onChange={(e)=>setName(e.target.value)} value={name} style={{border:"solid 1px black"}} /> <br /> <br />
    <input type="email" placeholder='email' onChange={(e)=>setEmail(e.target.value)} value={email} style={{border:"solid 1px black"}} /> <br /> <br />
    <input type="password" placeholder='password' onChange={(e)=>setPassword(e.target.value)} value={password} style={{border:"solid 1px black"}} /> <br /> <br />

    <select name="
    " id="" onChange={(e)=>setRole(e.target.value)} value={role} style={{border:"solid 1px black"}}>
    <option hidden>Select</option>
    <option value="Admin">Admin</option>
    <option value="Staff">Staff</option>
    </select> <br /> <br />


    <select onChange={(e)=>setBranchName(e.target.value)} style={{border:"solid 1px black"}} value={branch}>
    {
        branchData?.map((x,y)=>{
        return(
        <option value={x._id} key={x._id}>{x.branchCode}</option>
            )
        })
    }
    </select> <br /> <br />
 
    <input type="submit" style={{border:"solid 1px black"}}  value={"Add User"}/>

    </form>
    
    
    </>
  )
}

export default page